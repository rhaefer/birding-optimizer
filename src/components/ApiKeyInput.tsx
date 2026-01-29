'use client';

import { useState } from 'react';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  initialApiKey?: string;
}

export default function ApiKeyInput({ onApiKeySet, initialApiKey = '' }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        setError(null);
        // Store in localStorage for persistence
        localStorage.setItem('ebird-api-key', apiKey.trim());
        onApiKeySet(apiKey.trim());
      } else {
        setError(data.error || 'Invalid API key');
        setIsValid(false);
      }
    } catch {
      setError('Failed to validate API key. Please try again.');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">eBird API Key</h2>

      <p className="text-gray-600 text-sm mb-4">
        Enter your eBird API key to get started. You can get a free API key from{' '}
        <a
          href="https://ebird.org/api/keygen"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          ebird.org/api/keygen
        </a>
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsValid(false);
              setError(null);
            }}
            placeholder="Enter your eBird API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isValidating}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {isValid && (
          <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
            API key validated successfully!
          </div>
        )}

        <button
          onClick={validateKey}
          disabled={isValidating || !apiKey.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? 'Validating...' : 'Validate & Continue'}
        </button>
      </div>
    </div>
  );
}
