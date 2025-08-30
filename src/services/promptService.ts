import {settingsService, LanguageType} from './settingsService';

interface LanguagePrompts {
  systemPrompt: string;
  pdfContextPrompt: string;
  generalPrompt: string;
}

const prompts: Record<LanguageType, LanguagePrompts> = {
  en: {
    systemPrompt:
      'You are a helpful English learning assistant. Respond in English and provide clear, educational explanations. When explaining English words or phrases, include definitions, usage examples, and pronunciation guidance when helpful.',
    pdfContextPrompt:
      'PDF Context:\n{pdfContext}\n\nUser Question:\n{message}\n\nPlease answer the question based on the PDF content if relevant, or provide general English learning help if the question is not related to the PDF content. Explain any difficult English words or phrases.',
    generalPrompt:
      'User Question:\n{message}\n\nPlease provide helpful English learning assistance. Focus on clear explanations and practical usage examples.',
  },
  ja: {
    systemPrompt:
      'あなたは英語学習を支援するアシスタントです。日本語で回答し、分かりやすく教育的な説明を提供してください。英単語や表現について説明する際は、定義、使用例、必要に応じて発音ガイダンスを含めてください。',
    pdfContextPrompt:
      'PDFコンテキスト:\n{pdfContext}\n\nユーザーの質問:\n{message}\n\n関連する場合はPDFの内容に基づいて回答し、PDFの内容と関連がない場合は一般的な英語学習支援を提供してください。難しい英単語や表現があれば説明してください。',
    generalPrompt:
      'ユーザーの質問:\n{message}\n\n英語学習に役立つアシスタンスを日本語で提供してください。明確な説明と実用的な使用例に焦点を当ててください。',
  },
};

class PromptService {
  getSystemPrompt(): string {
    const language = settingsService.getLanguage();
    return prompts[language].systemPrompt;
  }

  buildPrompt(message: string, pdfContext?: string): string {
    const language = settingsService.getLanguage();
    const languagePrompts = prompts[language];

    if (pdfContext) {
      return languagePrompts.pdfContextPrompt
        .replace('{pdfContext}', pdfContext.slice(0, 3000))
        .replace('{message}', message);
    }

    return languagePrompts.generalPrompt.replace('{message}', message);
  }

  addLanguageInstruction(basePrompt: string): string {
    const systemPrompt = this.getSystemPrompt();

    return `${systemPrompt}

${basePrompt}`;
  }
}

export const promptService = new PromptService();
