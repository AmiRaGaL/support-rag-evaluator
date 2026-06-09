# Prompt Design

## System behavior

The assistant must answer only from retrieved support documentation.

If the retrieved context does not contain enough evidence, the assistant must say:

```text
I don't know based on the provided support documents.
```

# Answer requirements

Supported answers should include:

- Direct answer
- Short explanation
- Citations
- No unsupported claims

Unsupported answers should include:

- Refusal message
- Empty citations
- Low confidence