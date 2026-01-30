Listen first check the / to know how design, what design what font what color what background etc to know how to make the rich and premium website

make a /web

make max tokens 128000 here are the NEW API DOCS [NOT POLLINATIONS THIS ONE IS SMTH ELSE]

GPT 5.2
openai/gpt-5.2

The top-performing model for coding and AI agent tasks in any field.

1. Authentication
The API uses API Key authentication. Set your API key as an environment variable or include it in the request header.

Get API Key

Get an existing API key or create a new one from the API Keys management page

Setup API Key:

export API_KEY="YOUR_API_KEY"

Authorization Header:

All requests must include the API key in the Authorization header:

Authorization: Bearer YOUR_API_KEY

2. Quick Start
This is a synchronous API (no queue / no request_id polling).

Complete Example (Non-stream):

curl -X POST "https://api.apifree.ai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @- <<'JSON'
{
  "max_tokens": 4096,
  "messages": [
    {
      "content": "Explain how a blockchain works in simple terms.",
      "role": "user"
    }
  ],
  "model": "openai/gpt-5.2",
  "stream": false
}
JSON

3. API Endpoints
3.1 Create Chat Completion
Generate text from an LLM. The model is selected via the model field in the request body.

Endpoint: POST /v1/chat/completions

Headers:

Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
Request Body:

{
  "max_tokens": 4096,
  "messages": [
    {
      "content": "Explain how a blockchain works in simple terms.",
      "role": "user"
    }
  ],
  "model": "openai/gpt-5.2",
  "stream": false
}

Example:

curl -X POST "https://api.apifree.ai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @- <<'JSON'
{
  "max_tokens": 4096,
  "messages": [
    {
      "content": "Explain how a blockchain works in simple terms.",
      "role": "user"
    }
  ],
  "model": "openai/gpt-5.2",
  "stream": false
}
JSON

Response (Non-stream):

Returns an JSON object (HTTP 200).

{
  "choices": [
    {
      "content_filter_results": {},
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "annotations": [],
        "content": "A blockchain is a shared digital notebook that lots of computers keep in sync.Blocks = pages of records: Transactions (like “Alice sends Bob 5 coins”) are bundled into a “block,” like a page full of entries.Chain = pages linked together: Each new block includes a special fingerprint (a hash) of the previous block. That links blocks in order, forming a chain.Shared copies: Instead of one company owning the notebook, many computers (called nodes) each store a copy of the whole chain.Agreement (consensus): Before a new block is added, the network must agree it’s valid—using rules like:Proof of Work: computers solve a hard puzzle to earn the right to add the block.Proof of Stake: validators who lock up funds are chosen to add/confirm blocks.Hard to tamper: If someone tries to change an old transaction, that block’s hash changes, which breaks the link to later blocks. They’d have to redo/override the network’s agreement for all following blocks, which is extremely difficult in a large network.So, a blockchain works by grouping transactions into blocks, linking them with cryptographic fingerprints, and having many computers agree on the same history, making the record very hard to change later.",
        "refusal": null,
        "role": "assistant"
      }
    }
  ],
  "created": 1767699130,
  "id": "d3abf40722b42dba",
  "model": "openai/gpt-5.2",
  "object": "chat.completion",
  "prompt_filter_results": [
    {
      "content_filter_results": {},
      "prompt_index": 0
    }
  ],
  "system_fingerprint": null,
  "usage": {
    "completion_tokens": 14,
    "completion_tokens_details": {
      "accepted_prediction_tokens": 0,
      "audio_tokens": 0,
      "reasoning_tokens": 0,
      "rejected_prediction_tokens": 0
    },
    "cost": 0.00014,
    "prompt_tokens": 7,
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 0
    },
    "total_tokens": 21
  }
}

3.2 Streaming (Optional)
If you set stream=true, the API uses SSE (Content-Type: text/event-stream) and returns incremental chunks.

Example:

curl -N -X POST "https://api.apifree.ai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @- <<'JSON'
{
  "max_tokens": 4096,
  "messages": [
    {
      "content": "Explain how a blockchain works in simple terms.",
      "role": "user"
    }
  ],
  "model": "openai/gpt-5.2",
  "stream": true
}
JSON

Notes:

Each event is prefixed with data: ...
The stream ends with:
data: [DONE]

Response Example (stream=true):

data: {"choices":[],"created":0,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","object":"","prompt_filter_results":[{"content_filter_results":{},"prompt_index":0}]}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"","refusal":null,"role":"assistant"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"A","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"Hi"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"S","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"—"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"aA","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"what"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"RFr98lZ18yY0aB2","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" can"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"DQpQlvKh26ZOtBK","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" I"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"U","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" help"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"QsZuULWHlrTwnX","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" you"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"wfQtUtdduXLSwxs","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" with"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"4GGq7D6zX3lDMP","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":" today"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"NdXz6ORDKR7sx","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"?"},"finish_reason":null,"index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"Rs","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{},"finish_reason":"stop","index":0,"logprobs":null}],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"H0Zizgzuz4M6G","object":"chat.completion.chunk","system_fingerprint":null,"usage":null}

data: {"choices":[],"created":1767699506,"id":"85f41967e0a4de78","model":"openai/gpt-5.2","obfuscation":"dWO","object":"chat.completion.chunk","system_fingerprint":null,"usage":{"completion_tokens":14,"completion_tokens_details":{"accepted_prediction_tokens":0,"audio_tokens":0,"reasoning_tokens":0,"rejected_prediction_tokens":0},"cost":0.0001561875,"cost_detail":{"completion_cost":0.000147,"prompt_cost":0.0000091875},"prompt_tokens":7,"prompt_tokens_details":{"audio_tokens":0,"cached_tokens":0},"total_tokens":21}}

data: [DONE]

4. Errors
Errors are returned in OpenAI-compatible format (HTTP 200):

{
  "error": {
    "code": "invalid_request_error",
    "message": "invalid params: ...",
    "type": "invalid_request_error"
  }
}

5. Schema
Input
messages
Type: array | Required: ✓

Sequence of input messages used to generate a response.

Constraints:

Min Length: 1
Default value: [{"content": "Explain how a blockchain works in simple terms.", "role": "user"}]

max_tokens
Type: int

Maximum number of tokens the model can generate.

Constraints:

Min: 1
Max: 128000
Default value: 4096

stream
Type: bool

Whether to stream partial responses.

Default value: false

Example input:

{
  "max_tokens": 4096,
  "messages": [
    {
      "content": "Explain how a blockchain works in simple terms.",
      "role": "user"
    }
  ],
  "stream": false
}

for the api key gimme 3 box to fill ill give 3 api key 3 will be main it will just randomly choose an api key if not work then other if not then other okay?

add system / instructions of how to make

so basically

there will be in /web 3 boarders one textbox second for live preview and loading screen and 3rd for code preview

user will type prompt of how they want then ai will generate html css js only

[ if you dont know how to handle instructions check mcq generator]

then it will be live preview and also insludes a blob link for live preview

do common sense and do the rest

also the image i sent is just a blueprint of what the web should look