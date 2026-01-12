export enum Sender {
  Bot = 'bot',
  User = 'user'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  type?: 'text' | 'file_info' | 'output';
  fileName?: string;
  outputContent?: string;
}

export enum AppStep {
  AskScript = 0,
  AskTemplate = 1,
  AskTheme = 2,
  Processing = 3,
  Finished = 4
}
