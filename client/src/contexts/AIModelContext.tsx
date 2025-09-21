import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AIModel = 'gemini' | 'openai' | 'claude';

interface AIModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  modelConfig: {
    name: string;
    displayName: string;
    color: string;
    description: string;
    available: boolean;
  };
}

const AIModelContext = createContext<AIModelContextType | undefined>(undefined);

const AI_MODELS = {
  gemini: {
    name: 'gemini',
    displayName: 'Gemini AI',
    color: '#4285F4',
    description: 'Google\'s advanced AI model for comprehensive analysis',
    available: true,
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (GPT-5-nano)',
    color: '#00A67E',
    description: 'OpenAI\'s cutting-edge GPT-5-nano model',
    available: true,
  },
  claude: {
    name: 'claude',
    displayName: 'Claude AI',
    color: '#FF6B35',
    description: 'Anthropic\'s Claude AI for intelligent analysis',
    available: false, // Not implemented yet
  },
};

interface AIModelProviderProps {
  children: ReactNode;
}

export const AIModelProvider: React.FC<AIModelProviderProps> = ({ children }) => {
  const [selectedModel, setSelectedModelState] = useState<AIModel>('gemini');

  // Load saved preference on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('preferred-ai-model') as AIModel;
    if (savedModel && AI_MODELS[savedModel]) {
      setSelectedModelState(savedModel);
    }
  }, []);

  const setSelectedModel = (model: AIModel) => {
    setSelectedModelState(model);
    localStorage.setItem('preferred-ai-model', model);
    console.log(`🤖 AI Model changed to: ${model}`);
  };

  const modelConfig = AI_MODELS[selectedModel];

  const value: AIModelContextType = {
    selectedModel,
    setSelectedModel,
    modelConfig,
  };

  return (
    <AIModelContext.Provider value={value}>
      {children}
    </AIModelContext.Provider>
  );
};

export const useAIModel = (): AIModelContextType => {
  const context = useContext(AIModelContext);
  if (context === undefined) {
    throw new Error('useAIModel must be used within an AIModelProvider');
  }
  return context;
};

export { AI_MODELS };