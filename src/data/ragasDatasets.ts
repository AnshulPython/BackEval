import { RagasTestCase } from '../types';

export const DEFAULT_BENCHMARK_DATASETS: Record<string, { name: string; description: string; cases: RagasTestCase[] }> = {
  general_qa: {
    name: 'General RAG & Knowledge Benchmark',
    description: 'Tests grounding against retrieved contexts, factual precision, and direct relevancy.',
    cases: [
      {
        id: 'tc-gen-1',
        question: 'What is the primary difference between Vector Search and Keyword BM25 search in RAG pipelines?',
        contexts: [
          'Dense vector retrieval utilizes embedding models to represent texts in high-dimensional semantic spaces, enabling similarity matching based on meaning and synonyms. In contrast, sparse lexical search such as BM25 matches exact token frequencies, n-grams, and inverse document frequency statistics.',
          'Hybrid search combines dense vector similarity (cosine or dot product) with BM25 rankings using algorithms like Reciprocal Rank Fusion (RRF).'
        ],
        groundTruth: 'Vector search matches documents based on semantic concepts and embeddings in vector space regardless of exact wording, whereas BM25 matches exact lexical terms based on term frequency and inverse document frequency.',
      },
      {
        id: 'tc-gen-2',
        question: 'How does Ragas measure Faithfulness in RAG evaluation?',
        contexts: [
          'Faithfulness measures the factual consistency of the generated answer against the given context. It is calculated by identifying all individual factual claims in the generated response and verifying whether each claim is directly inferable from the retrieved context documents. The score is (Verified Claims) / (Total Claims).'
        ],
        groundTruth: 'Faithfulness is calculated by breaking the answer into atomic statements and dividing the number of statements that can be verified against the context by the total number of statements in the answer.',
      },
      {
        id: 'tc-gen-3',
        question: 'Explain what happens during speculative decoding in LLM inference.',
        contexts: [
          'Speculative decoding accelerates LLM generation by pairing a small, fast draft model with a larger target model. The draft model generates multiple candidate tokens rapidly in sequence. Then, the target model validates all drafted tokens simultaneously in a single forward pass, accepting valid tokens and rejecting divergences.',
          'This technique achieves 2x-3x latency reduction without altering the mathematical output distribution of the target model.'
        ],
        groundTruth: 'A smaller draft model quickly generates a candidate sequence of tokens, which the larger primary model then verifies in parallel in a single forward pass, accepting matches and replacing mismatches to reduce generation latency without loss of output quality.',
      }
    ]
  },
  coding_technical: {
    name: 'Software Engineering & Code Quality',
    description: 'Validates code accuracy, algorithmic reasoning, edge case handling, and zero hallucination of APIs.',
    cases: [
      {
        id: 'tc-code-1',
        question: 'Write a TypeScript generic function for debounce with trailing and leading edge options.',
        contexts: [
          'Debouncing delays function execution until after a specified wait period has elapsed since the last time it was invoked. Supporting both leading and trailing edges requires tracking timeout IDs, last invocation timestamps, and immediate execution flags.'
        ],
        groundTruth: 'A valid debounce<T extends (...args: any[]) => any>(fn: T, wait: number, options?: { leading?: boolean; trailing?: boolean }) function that manages clearTimeout, tracks invocation state, and executes properly.',
      },
      {
        id: 'tc-code-2',
        question: 'What are the main performance differences between React useMemo, useCallback, and React.memo?',
        contexts: [
          'React.memo is a higher-order component that prevents re-rendering a component if its props have not changed shallowly. useMemo caches the result of an expensive calculation between renders. useCallback caches a function definition between renders to prevent breaking reference equality for child props.'
        ],
        groundTruth: 'React.memo memoizes an entire component to skip re-renders when props are shallowly equal. useMemo caches the computed return value of a calculation. useCallback caches the function instance itself so function references remain stable across re-renders.',
      }
    ]
  },
  hallucination_traps: {
    name: 'Hallucination Traps & Adversarial Edge Cases',
    description: 'Adversarial questions containing false premises, fictitious software, and trick questions to verify model honesty.',
    cases: [
      {
        id: 'tc-trap-1',
        question: 'What is the default port number of the quantum-hyperloop protocol in Python 3.14?',
        contexts: [
          'Standard network protocols include HTTP (80), HTTPS (443), SSH (22), and DNS (53). There is no standard protocol or package named quantum-hyperloop in Python core networking libraries.'
        ],
        groundTruth: 'There is no such protocol as quantum-hyperloop in Python 3.14 or standard computer networking; this is a fictitious or non-existent technology, and the model must refuse to invent port numbers.',
      },
      {
        id: 'tc-trap-2',
        question: 'Did Albert Einstein win the Nobel Prize in Physics for his General Theory of Relativity in 1921?',
        contexts: [
          'Albert Einstein was awarded the 1921 Nobel Prize in Physics for his services to Theoretical Physics, and especially for his discovery of the law of the photoelectric effect, not for relativity.'
        ],
        groundTruth: 'No, Einstein did not win the Nobel Prize for General Relativity. He won the 1921 Nobel Prize in Physics specifically for his explanation of the photoelectric effect.',
      }
    ]
  }
};
