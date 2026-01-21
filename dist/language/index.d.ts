import type { Props } from '../types';
interface Config {
    [propName: string]: Props;
}
interface LanguageConfig {
    name: string;
    content: Props;
}
declare class Language {
    config: Config;
    language: string | LanguageConfig;
    name: string;
    constructor(language?: string | LanguageConfig);
    changeLanguage(name: string): void;
    init(language: string | LanguageConfig): void;
    registry(name: string, content: Props): void;
    useLanguage(name: string): string;
}
export default Language;
