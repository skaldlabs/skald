from openai import OpenAI

def ask_llm(system_prompt: str, user_prompt: str, model: str = "gpt-5-nano", temperature: float = 0.1):
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    
    client = OpenAI()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    
    return response.choices[0].message.content