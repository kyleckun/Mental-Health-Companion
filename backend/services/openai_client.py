import os, httpx
from dotenv import load_dotenv
from fastapi import HTTPException, status # Import HTTPException
import asyncio
import random

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"
ENABLE_MOCK_MODE = os.getenv("ENABLE_MOCK_MODE", "false").lower() == "true"

HEADERS = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

MOCK_RESPONSES = [
    "Thank you for sharing that with me. It's completely normal to have ups and downs. How are you feeling right now?",
    "I understand. It sounds like you're going through a challenging time. Would you like to talk more about it?",
    "That's great to hear! It's wonderful that you're feeling positive. What contributed to this good mood?",
    "I'm here to listen and support you. Remember, it's okay to not be okay sometimes. What's on your mind?",
    "It's important to acknowledge how you're feeling. Taking time for self-care can really help. Have you tried any relaxation techniques?",
]

async def chat(messages, temperature=0.2):
    """
    Call OpenAI Chat Completion API
    messages: List[ {role: "...", content: "..."} ]
    """
    if ENABLE_MOCK_MODE:
        print("Mock Mode: Returning simulated AI response")
        await asyncio.sleep(0.5)
        return random.choice(MOCK_RESPONSES)

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured."
        )

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:  # Increased timeout for long responses
            r = await client.post(OPENAI_BASE_URL, headers=HEADERS, json=payload)
            r.raise_for_status()
            data = r.json()

            # Check if the expected keys exist in the response
            if "choices" in data and len(data["choices"]) > 0 and "message" in data["choices"][0] and "content" in data["choices"][0]["message"]:
                return data["choices"][0]["message"]["content"]
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unexpected response format from OpenAI API."
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to OpenAI API: {e}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"OpenAI API returned an error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred with OpenAI API: {e}"
        )


async def chat_stream(messages, temperature=0.2):
    """
    Call OpenAI Chat Completion API with streaming
    messages: List[ {role: "...", content: "..."} ]
    Yields: str chunks of the response
    """
    if ENABLE_MOCK_MODE:
        print("Mock Mode: Returning simulated streaming response")
        response_text = random.choice(MOCK_RESPONSES)
        for char in response_text:
            await asyncio.sleep(0.02)
            yield char
        return

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured."
        )

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "stream": True  # Enable streaming
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", OPENAI_BASE_URL, headers=HEADERS, json=payload) as r:
                r.raise_for_status()

                async for line in r.aiter_lines():
                    if line.strip() == "" or line.strip() == "data: [DONE]":
                        continue

                    if line.startswith("data: "):
                        try:
                            import json
                            chunk_data = json.loads(line[6:])  # Remove "data: " prefix

                            if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                                delta = chunk_data["choices"][0].get("delta", {})
                                content = delta.get("content", "")

                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue  # Skip malformed JSON

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to OpenAI API: {e}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"OpenAI API returned an error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred with OpenAI API: {e}"
        )
