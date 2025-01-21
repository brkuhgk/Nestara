#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "Environment variables loaded successfully!"
else
  echo "Error: .env file not found!"
  exit 1
fi
