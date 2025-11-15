#!/usr/bin/env bash

echo "Installing Supabase CLI..."
curl -fsSL https://cli.supabase.com/install/linux | sh

echo "Installing TypeScript tools..."
pnpm add -D typescript ts-node @types/node

echo "Installing LangChain..."
pnpm add langchain openai @supabase/supabase-js

echo "Environment setup complete."
