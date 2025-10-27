import os, httpx
from dotenv import load_dotenv

# 加载 .env 文件中的 OPENAI_API_KEY
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"  # 可根据学校要求替换为其他 OpenAI 模型

HEADERS = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

async def chat(messages, temperature=0.2):
    """
    调用 OpenAI Chat Completion API
    messages: List[ {role: "...", content: "..."} ]
    """
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(OPENAI_BASE_URL, headers=HEADERS, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]
