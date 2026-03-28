
# ═══════════════════════════════════════════════════════════════════════════════
# AXON — Pipeline de Fine-Tuning cu Google Colab
# ═══════════════════════════════════════════════════════════════════════════════
#
# Instrucțiuni:
# 1. Deschide https://colab.research.google.com
# 2. Copiază acest script în Colab (sau File > Upload .ipynb)
# 3. Alege Runtime > Change runtime type > GPU (T4 sau A100)
# 4. Rulează celulele în ordine
# 5. La final, descarcă modelul fine-tuned și pune-l pe telefon
#
# Ce face acest script:
# - Descarcă Phi-3 Mini 4K Instruct
# - Fine-tunează cu LoRA pe datele tale de conversație din Axon
# - Exportă modelul GGUF (compatibil llama.rn)
# ═══════════════════════════════════════════════════════════════════════════════

# ─── CELULA 1: Instalare pachete ─────────────────────────────────────────────

# %%
# Instalare - rulează o singură dată
import subprocess
subprocess.run([
    "pip", "install", "-q",
    "transformers", "peft", "bitsandbytes",
    "trl", "accelerate", "datasets",
    "sentencepiece", "protobuf",
    "huggingface_hub", "llama-cpp-python",
], check=True)

print("✅ Pachete instalate")

# ─── CELULA 2: Configurare ────────────────────────────────────────────────────

# %%
import os
import json
from pathlib import Path
from datasets import Dataset
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig,
    TrainingArguments, pipeline,
)
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer

# ─── Configurare ─────────────────────────────────────────────────────────────
MODEL_ID = "microsoft/Phi-3-mini-4k-instruct"
OUTPUT_DIR = "/content/axon_finetuned"
MERGED_DIR = "/content/axon_merged"
GGUF_OUTPUT = "/content/axon_phi3_custom.gguf"

# ─── CELULA 3: Încarcă datele de antrenament ─────────────────────────────────

# %%
# Opțiunea A: Încarcă fișierul JSONL exportat din Axon de pe telefon
# (copiază axon_training_XXXXX.jsonl în Google Drive și montează-l)

# Montare Google Drive (opțional)
from google.colab import drive
drive.mount('/content/drive')

# Calea spre fișierul tău de training exportat din Axon
TRAINING_FILE = "/content/drive/MyDrive/axon_training.jsonl"  # SCHIMBĂ CALEA

# Opțiunea B: Date de training demo (dacă nu ai fișier propriu)
DEMO_DATA = [
    {
        "messages": [
            {"role": "user", "content": "Ce este inteligența artificială?"},
            {"role": "assistant", "content": "Inteligența artificială este domeniul informaticii care creează sisteme capabile să execute sarcini care necesită în mod normal inteligență umană — raționament, învățare, percepție și luarea deciziilor."}
        ]
    },
    {
        "messages": [
            {"role": "user", "content": "Explică-mi ce este machine learning."},
            {"role": "assistant", "content": "Machine learning este o ramură a AI unde sistemele învață automat din date fără a fi programate explicit. Prin algoritmi, modelele identifică tipare și îmbunătățesc performanța cu experiența."}
        ]
    },
    {
        "messages": [
            {"role": "user", "content": "Ești Axon, asistentul meu offline?"},
            {"role": "assistant", "content": "Da, sunt Axon — asistentul tău AI personal care funcționează 100% offline. Toată procesarea se face direct pe dispozitivul tău, fără date trimise în cloud."}
        ]
    },
    {
        "messages": [
            {"role": "user", "content": "Ce poți face tu?"},
            {"role": "assistant", "content": "Pot să răspund la întrebări, să rețin fapte pe care mi le spui, să studiez documente, să detectez entități (persoane, locuri, numere), să raționez logic din informații, și să îmi amintesc conversații anterioare — totul offline."}
        ]
    },
    {
        "messages": [
            {"role": "user", "content": "Câte state are România?"},
            {"role": "assistant", "content": "România este organizată în 41 de județe plus municipiul București, care are statut special. Județele sunt grupate în 8 regiuni de dezvoltare."}
        ]
    },
]

# Încarcă datele
def load_training_data():
    data = []

    # Încearcă să încarce din fișier
    if Path(TRAINING_FILE).exists():
        with open(TRAINING_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        print(f"✅ Încărcat {len(data)} perechi din fișierul tău Axon")
    else:
        print("⚠️ Fișierul de training nu a fost găsit. Folosesc datele demo.")
        data = DEMO_DATA

    return data

raw_data = load_training_data()
print(f"Total perechi de antrenament: {len(raw_data)}")

# ─── CELULA 4: Pregătire date pentru Phi-3 ───────────────────────────────────

# %%
SYSTEM_PROMPT = """Ești Axon, un asistent AI personal care rulează complet offline.
Răspunzi ÎNTOTDEAUNA în română. Ești direct, inteligent și loial utilizatorului tău.
Nu trimiți date în cloud. Toate calculele se fac local pe dispozitiv."""

def format_phi3_chat(sample):
    """Formateaza conversația în formatul Phi-3 (ChatML)"""
    messages = sample["messages"]
    formatted = f"<|system|>\n{SYSTEM_PROMPT}<|end|>\n"

    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        if role == "user":
            formatted += f"<|user|>\n{content}<|end|>\n"
        elif role == "assistant":
            formatted += f"<|assistant|>\n{content}<|end|>\n"

    formatted += "<|endoftext|>"
    return {"text": formatted}

# Aplică formatarea
formatted_data = [format_phi3_chat(s) for s in raw_data]
dataset = Dataset.from_list(formatted_data)

# Split train/validation
dataset = dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = dataset["train"]
eval_dataset = dataset["test"]

print(f"Train: {len(train_dataset)} | Eval: {len(eval_dataset)}")
print("\nExemplu de intrare formatată:")
print(train_dataset[0]["text"][:500])

# ─── CELULA 5: Încarcă modelul cu quantizare 4-bit ───────────────────────────

# %%
print("Se încarcă Phi-3 Mini...")

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype="float16",
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    torch_dtype="auto",
)

print("✅ Model încărcat")
print(f"Parametri totali: {sum(p.numel() for p in model.parameters()):,}")

# ─── CELULA 6: Configurare LoRA ───────────────────────────────────────────────

# %%
lora_config = LoraConfig(
    r=16,                          # Rang LoRA (mai mare = mai multă capacitate)
    lora_alpha=32,                 # Scaling factor
    target_modules=[               # Module target pentru Phi-3
        "q_proj", "k_proj", "v_proj",
        "o_proj", "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ─── CELULA 7: Antrenament ────────────────────────────────────────────────────

# %%
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,            # 3 epoci pentru dataset mic
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    evaluation_strategy="steps",
    eval_steps=50,
    save_strategy="epoch",
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    report_to="none",              # Dezactivează wandb
    dataloader_pin_memory=False,
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    dataset_text_field="text",
    max_seq_length=1024,
    tokenizer=tokenizer,
    packing=False,
)

print("🚀 Pornesc antrenamentul...")
trainer.train()
print("✅ Antrenament finalizat!")

# ─── CELULA 8: Salvare și merge ───────────────────────────────────────────────

# %%
# Salvează adaptorul LoRA
trainer.model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"✅ Adaptor LoRA salvat în {OUTPUT_DIR}")

# Merge LoRA cu modelul de bază (necesită mai multă RAM)
print("Se face merge LoRA + model de bază...")
model = trainer.model.merge_and_unload()
model.save_pretrained(MERGED_DIR)
tokenizer.save_pretrained(MERGED_DIR)
print(f"✅ Model final salvat în {MERGED_DIR}")

# ─── CELULA 9: Conversie în GGUF ─────────────────────────────────────────────

# %%
# Instalează llama.cpp pentru conversie
import subprocess

subprocess.run([
    "pip", "install", "-q", "llama-cpp-python",
    "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu121"
], check=False)

# Descarcă llama.cpp pentru scriptul de conversie
subprocess.run(["git", "clone", "--depth=1",
    "https://github.com/ggerganov/llama.cpp.git",
    "/content/llama.cpp"], capture_output=True)

subprocess.run(["pip", "install", "-q", "-r",
    "/content/llama.cpp/requirements.txt"], check=True)

# Conversie în GGUF Q4_K_M
result = subprocess.run([
    "python", "/content/llama.cpp/convert_hf_to_gguf.py",
    MERGED_DIR,
    "--outfile", GGUF_OUTPUT,
    "--outtype", "q4_k_m",
], capture_output=True, text=True)

print(result.stdout)
if result.returncode != 0:
    print("⚠️ Eroare la conversie GGUF:")
    print(result.stderr)
else:
    import os
    size_mb = os.path.getsize(GGUF_OUTPUT) / (1024 * 1024)
    print(f"✅ Model GGUF creat: {GGUF_OUTPUT} ({size_mb:.0f} MB)")

# ─── CELULA 10: Descarcă modelul ──────────────────────────────────────────────

# %%
# Opțiunea 1: Descarcă direct din Colab
from google.colab import files
print("Descarcă modelul GGUF (apasă butonul de mai jos)...")
files.download(GGUF_OUTPUT)

# Opțiunea 2: Salvează în Google Drive
import shutil
drive_path = "/content/drive/MyDrive/axon_phi3_custom.gguf"
shutil.copy(GGUF_OUTPUT, drive_path)
print(f"✅ Model salvat și în Google Drive: {drive_path}")

# ─── CELULA 11: Testare rapidă ────────────────────────────────────────────────

# %%
# Testează modelul înainte de a-l descărca
test_pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=200,
)

test_messages = [
    {"role": "system", "content": SYSTEM_PROMPT},
    {"role": "user", "content": "Cine ești tu?"},
]

output = test_pipe(test_messages)
print("🧠 Răspuns test:")
print(output[0]["generated_text"][-1]["content"])

# ─── INSTRUCȚIUNI FINALE ──────────────────────────────────────────────────────

print("""
═══════════════════════════════════════════════════════════
✅ PROCES COMPLET!

Pașii următori:
1. Descarcă fișierul .gguf de mai sus (~2-3 GB)
2. Transferă pe telefon în: Files > Axon > models/
3. Redenumește-l: phi-3-mini-4k-instruct-q4.gguf
4. Deschide Axon → Setări → Model AI → Verifică starea
5. Axon va folosi automat noul model!

Notă: Prima rulare după instalare durează ~30 secunde.
═══════════════════════════════════════════════════════════
""")
