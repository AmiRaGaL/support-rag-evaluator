# Evaluation

## Purpose

This project is eval-driven. The assistant should be measured, not judged only by manual demos.

## Planned metrics

| Metric | Description |
|---|---|
| Retrieval recall@k | Whether the expected source appears in the top-k retrieved chunks |
| Answer correctness | Whether the answer matches the expected answer |
| Citation faithfulness | Whether cited chunks support the generated answer |
| Refusal accuracy | Whether unsupported questions are refused |
| Average latency | Mean response time per query |
| Estimated cost | Approximate LLM and embedding cost per query |

## Baseline eval file

Evaluation cases will live in:

```text
datasets/evals/baseline.json