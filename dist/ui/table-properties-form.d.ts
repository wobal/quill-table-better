import type { Props, TableContainer, TableMenus, UseLanguageHandler } from '../types';
interface Child {
    category: string;
    propertyName: string;
    value?: string;
    attribute?: Props;
    options?: string[];
    tooltip?: string;
    menus?: Menus[];
    valid?: (value?: string) => boolean;
    message?: string;
}
interface Menus {
    icon: string;
    describe: string;
    align: string;
}
interface Properties {
    content: string;
    children: Child[];
}
interface Options {
    type: string;
    attribute: Props;
}
declare class TablePropertiesForm {
    tableMenus: TableMenus;
    options: Options;
    attrs: Props;
    borderForm: HTMLElement[];
    saveButton: HTMLButtonElement;
    form: HTMLDivElement;
    constructor(tableMenus: TableMenus, options?: Options);
    checkBtnsAction(status: string): void;
    createActionBtns(listener: EventListener, showLabel: boolean): HTMLDivElement;
    createCheckBtns(child: Child): HTMLDivElement;
    createColorContainer(child: Child): HTMLDivElement;
    createColorInput(child: Child): HTMLDivElement;
    createColorList(propertyName: string): HTMLUListElement;
    createColorPicker(child: Child): HTMLSpanElement;
    createColorPickerIcon(svg: string, text: string, listener: EventListener): HTMLDivElement;
    createColorPickerSelect(propertyName: string): HTMLDivElement;
    createDropdown(value: string, category?: string): {
        dropdown: HTMLDivElement;
        dropText: HTMLSpanElement;
    };
    createInput(child: Child): HTMLDivElement;
    createList(child: Child, dropText?: HTMLSpanElement): HTMLUListElement;
    createPalette(propertyName: string, useLanguage: UseLanguageHandler, parent: HTMLElement): HTMLDivElement;
    createProperty(property: Properties): HTMLDivElement;
    createPropertyChild(child: Child): HTMLDivElement;
    createPropertiesForm(options: Options): HTMLDivElement;
    getCellStyle(td: Element, attrs: Props): string;
    getColorClosest(container: HTMLElement): Element;
    getComputeBounds(type: string): {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    getDiffProperties(): Props;
    getUseLanguage(): any;
    getViewportSize(): {
        viewWidth: number;
        viewHeight: number;
    };
    hiddenSelectList(element: HTMLElement): void;
    removePropertiesForm(): void;
    saveAction(type: string): void;
    saveCellAction(): void;
    saveTableAction(): void;
    setAttribute(propertyName: string, value: string, container?: HTMLElement): void;
    setBorderDisabled(): void;
    setSaveButton(container: HTMLDivElement): void;
    setSaveButtonDisabled(disabled: boolean): void;
    switchButton(container: HTMLDivElement, target: HTMLSpanElement): void;
    switchHidden(container: HTMLElement, valid: boolean): void;
    toggleBorderDisabled(value: string): void;
    toggleHidden(container: HTMLElement): void;
    updateInputValue(element: Element, value: string): void;
    updateInputStatus(container: HTMLElement, status: boolean, isColor?: boolean): void;
    updatePropertiesForm(container: HTMLElement, type: string): void;
    updateSelectColor(element: Element, value: string): void;
    updateSelectedStatus(container: HTMLDivElement, value: string, type: string): void;
    updateTableWidth(table: HTMLElement, tableBlot: TableContainer, isPercent: boolean): void;
}
export default TablePropertiesForm;
