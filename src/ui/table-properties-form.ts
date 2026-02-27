import Quill from 'quill';
import type {
  Props,
  TableCell,
  TableCellBlock,
  TableContainer,
  TableHeader,
  TableList,
  TableMenus,
  UseLanguageHandler
} from '../types';
import eraseIcon from '../assets/icon/erase.svg';
import downIcon from '../assets/icon/down.svg';
import paletteIcon from '../assets/icon/palette.svg';
import saveIcon from '../assets/icon/check.svg';
import closeIcon from '../assets/icon/close.svg';
import { getProperties } from '../config';
import {
  addDimensionsUnit,
  createTooltip,
  getClosestElement,
  getComputeSelectedCols,
  getCorrectBounds,
  getCorrectContainerWidth,
  getCorrectWidth,
  isDimensions,
  isValidColor,
  setElementProperty,
  setElementAttribute,
  updateTableWidth as updateTableWidthUtil
} from '../utils';
import { ListContainer } from '../formats/list';
import iro from '@jaames/iro';

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

interface ColorList {
  value: string;
  describe: string;
}

const MIN_WIDTH = 30;
const MIN_HEIGHT = 22;

const ACTION_LIST = [
  { icon: saveIcon, label: 'save', type: 'button' },
  { icon: closeIcon, label: 'cancel', type: 'button' }
];

const COLOR_LIST: ColorList[] = [
  { value: '#000000', describe: 'black' },
  { value: '#4d4d4d', describe: 'dimGrey' },
  { value: '#808080', describe: 'grey' },
  { value: '#e6e6e6', describe: 'lightGrey' },
  { value: '#ffffff', describe: 'white' },
  { value: '#ff0000', describe: 'red' },
  { value: '#ffa500', describe: 'orange' },
  { value: '#ffff00', describe: 'yellow' },
  { value: '#99e64d', describe: 'lightGreen' },
  { value: '#008000', describe: 'green' },
  { value: '#7fffd4', describe: 'aquamarine' },
  { value: '#40e0d0', describe: 'turquoise' },
  { value: '#4d99e6', describe: 'lightBlue' },
  { value: '#0000ff', describe: 'blue' },
  { value: '#800080', describe: 'purple' }
];

/** (Thomas --> Je rajoute du commentaire pour moi et pour les devs pour que ça aide)
 * Classe principale gérant le formulaire flottant de propriétés (Tableau & Cellules).
 * Gère la création de l'interface, la sélection des couleurs et l'application
 * des styles complexes (redimensionnement intelligent, gestion des lignes, etc.).
 */
class TablePropertiesForm {
  tableMenus: TableMenus;
  options: Options;
  attrs: Props;
  borderForm: HTMLElement[];
  saveButton: HTMLButtonElement;
  form: HTMLDivElement;
  constructor(tableMenus: TableMenus, options?: Options) {
    this.tableMenus = tableMenus;
    this.options = options;
    this.attrs = { ...options.attribute };
    this.borderForm = [];
    this.saveButton = null;
    this.form = this.createPropertiesForm(options);
  }

  checkBtnsAction(status: string) {
    if (status === 'save') {
      this.saveAction(this.options.type);
    }
    this.removePropertiesForm();
    this.tableMenus.showMenus();
    this.tableMenus.updateMenus();
  }

  createActionBtns(listener: EventListener, showLabel: boolean) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    container.classList.add('properties-form-action-row');
    for (const { icon, label, type } of ACTION_LIST) {
      const button = document.createElement('button');
      const iconContainer = document.createElement('span');
      iconContainer.innerHTML = icon;
      button.appendChild(iconContainer);
      setElementAttribute(button, { label, type });
      if (showLabel) {
        const labelContainer = document.createElement('span');
        labelContainer.innerText = useLanguage(label);
        button.appendChild(labelContainer);
      }
      fragment.appendChild(button);
    }
    container.addEventListener('click', e => listener(e));
    container.appendChild(fragment);
    return container;
  }

  createCheckBtns(child: Child) {
    const { menus, propertyName } = child;
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    for (const { icon, describe, align } of menus) {
      const container = document.createElement('span');
      container.innerHTML = icon;
      container.setAttribute('data-align', align);
      container.classList.add('ql-table-tooltip-hover');
      if (this.options.attribute[propertyName] === align) {
        container.classList.add('ql-table-btns-checked');
      }
      const tooltip = createTooltip(describe);
      container.appendChild(tooltip);
      fragment.appendChild(container);
    }
    container.classList.add('ql-table-check-container');
    container.appendChild(fragment);
    container.addEventListener('click', e => {
      const target: HTMLSpanElement = (
        e.target as HTMLElement
      ).closest('span.ql-table-tooltip-hover');
      const value = target.getAttribute('data-align');
      this.switchButton(container, target);
      this.setAttribute(propertyName, value);
    });
    return container;
  }

  createColorContainer(child: Child) {
    const container = document.createElement('div');
    container.classList.add('ql-table-color-container');
    const input = this.createColorInput(child);
    const colorPicker = this.createColorPicker(child);
    container.appendChild(input);
    container.appendChild(colorPicker);
    return container;
  }

  createColorInput(child: Child) {
    const container = this.createInput(child);
    container.classList.add('label-field-view-color');
    return container;
  }

  createColorList(propertyName: string) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('ul');
    const fragment = document.createDocumentFragment();
    container.classList.add('color-list');
    const colors =
      this.tableMenus.tableBetter.colors.length === 0
        ? COLOR_LIST
        : typeof this.tableMenus.tableBetter.colors[0] === 'string'
          ? this.tableMenus.tableBetter.colors.map((item) => ({ value: item, describe: '' }))
          : COLOR_LIST;
    for (const { value, describe } of colors) {
      const li = document.createElement('li');
      li.setAttribute('data-color', value);
      setElementProperty(li, { 'background-color': value });
      if (describe != '') {
        const tooltip = createTooltip(useLanguage(describe));
        li.classList.add('ql-table-tooltip-hover');
        li.appendChild(tooltip);
      }
      fragment.appendChild(li);
    }
    container.appendChild(fragment);
    container.addEventListener('click', e => {
      const target = e.target as HTMLLIElement;
      const value = (
        target.tagName === 'DIV'
          ? target.parentElement
          : target
      ).getAttribute('data-color');
      this.setAttribute(propertyName, value, container);
      this.updateInputStatus(container, false, true);
    });
    return container;
  }

  createColorPicker(child: Child) {
    const { propertyName, value } = child;
    const container = document.createElement('span');
    const colorButton = document.createElement('span');
    container.classList.add('color-picker');
    colorButton.classList.add('color-button');
    if (value) {
      setElementProperty(colorButton, { 'background-color': value });
    } else {
      colorButton.classList.add('color-unselected');
    }
    const select = this.createColorPickerSelect(propertyName);
    colorButton.addEventListener('click', () => {
      this.toggleHidden(select);
      const colorContainer = this.getColorClosest(container);
      const input: HTMLInputElement = colorContainer?.querySelector('.property-input');
      this.updateSelectedStatus(select, input?.value, 'color');
    });
    container.appendChild(colorButton);
    container.appendChild(select);
    return container;
  }

  createColorPickerIcon(svg: string, text: string, listener: EventListener) {
    const container = document.createElement('div');
    const icon = document.createElement('span');
    const button = document.createElement('button');
    icon.innerHTML = svg;
    button.innerText = text;
    button.setAttribute('type', 'button');
    container.classList.add('erase-container');
    container.appendChild(icon);
    container.appendChild(button);
    container.addEventListener('click', listener);
    return container;
  }

  createColorPickerSelect(propertyName: string) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('div');
    const remove = this.createColorPickerIcon(
      eraseIcon,
      useLanguage('removeColor'),
      () => {
        this.setAttribute(propertyName, '', container);
        this.updateInputStatus(container, false, true);
      }
    );
    const list = this.createColorList(propertyName);
    const palette = this.createPalette(propertyName, useLanguage, container);
    container.classList.add('color-picker-select', 'ql-hidden');
    container.appendChild(remove);
    container.appendChild(list);
    container.appendChild(palette);
    return container;
  }

  createDropdown(value: string, category?: string) {
    const container = document.createElement('div');
    const dropText = document.createElement('span');
    const dropDown = document.createElement('span');
    switch (category) {
      case 'dropdown':
        dropDown.innerHTML = downIcon;
        dropDown.classList.add('ql-table-dropdown-icon');
        break;
      case 'color':
        break;
      default:
        break;
    }
    value && (dropText.innerText = value);
    container.classList.add('ql-table-dropdown-properties');
    dropText.classList.add('ql-table-dropdown-text');
    container.appendChild(dropText);
    if (category === 'dropdown') container.appendChild(dropDown);
    return { dropdown: container, dropText };
  }

  createInput(child: Child) {
    const { attribute, message, propertyName, value, valid } = child;
    const { placeholder = '' } = attribute;
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const status = document.createElement('div');
    container.classList.add('label-field-view');
    wrapper.classList.add('label-field-view-input-wrapper');
    label.innerText = placeholder;
    setElementAttribute(input, attribute);
    input.classList.add('property-input');
    input.value = value;
    input.addEventListener('input', e => {
      // debounce
      const value = (e.target as HTMLInputElement).value;
      valid && this.switchHidden(status, valid(value));
      this.updateInputStatus(wrapper, valid && !valid(value));
      this.setAttribute(propertyName, value, container);
    });
    status.classList.add('label-field-view-status', 'ql-hidden');
    message && (status.innerText = message);
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
    valid && container.appendChild(status);
    return container;
  }

  createList(child: Child, dropText?: HTMLSpanElement) {
    const { options, propertyName } = child;
    if (!options.length) return null;
    const container = document.createElement('ul');
    for (const option of options) {
      const list = document.createElement('li');
      list.innerText = option;
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    container.addEventListener('click', e => {
      const value = (e.target as HTMLLIElement).innerText;
      dropText.innerText = value;
      this.toggleBorderDisabled(value);
      this.setAttribute(propertyName, value);
    });
    return container;
  }

  createPalette(propertyName: string, useLanguage: UseLanguageHandler, parent: HTMLElement) {
    const container = document.createElement('div');
    const palette = document.createElement('div');
    const wrap = document.createElement('div');
    const iroContainer = document.createElement('div');
    // @ts-ignore
    const colorPicker = new iro.ColorPicker(iroContainer, {
      width: 110,
      layout: [
        {
          component: iro.ui.Wheel,
          options: {}
        }
      ]
    });
    const eraseContainer = this.createColorPickerIcon(
      paletteIcon,
      useLanguage('colorPicker'),
      () => this.toggleHidden(palette)
    );
    const btns = this.createActionBtns(
      (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('button');
        if (!target) return;
        const label = target.getAttribute('label');
        if (label === 'save') {
          this.setAttribute(
            propertyName,
            colorPicker.color.hexString,
            parent
          );
          this.updateInputStatus(container, false, true);
        }
        palette.classList.add('ql-hidden');
        parent.classList.add('ql-hidden');
      },
      false
    );
    palette.classList.add('color-picker-palette', 'ql-hidden');
    wrap.classList.add('color-picker-wrap')
    iroContainer.classList.add('iro-container');
    wrap.appendChild(iroContainer);
    wrap.appendChild(btns);
    palette.appendChild(wrap);
    container.appendChild(eraseContainer);
    container.appendChild(palette);
    return container;
  }

  createProperty(property: Properties) {
    const { content, children } = property;
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('div');
    const label = document.createElement('label');
    label.innerText = content;
    label.classList.add('ql-table-dropdown-label');
    container.classList.add('properties-form-row');
    if (children.length === 1) {
      container.classList.add('properties-form-row-full');
    }
    container.appendChild(label);
    for (const child of children) {
      const node = this.createPropertyChild(child);
      node && container.appendChild(node);
      if (node && content === useLanguage('border')) {
        this.borderForm.push(node);
      }
    }
    return container;
  }

  createPropertyChild(child: Child) {
    const { category, value } = child;
    switch (category) {
      case 'dropdown':
        const { dropdown, dropText } = this.createDropdown(value, category);
        const list = this.createList(child, dropText);
        dropdown.appendChild(list);
        dropdown.addEventListener('click', () => {
          this.toggleHidden(list);
          this.updateSelectedStatus(dropdown, dropText.innerText, 'dropdown');
        });
        return dropdown;
      case 'color':
        const colorContainer = this.createColorContainer(child);
        return colorContainer;
      case 'menus':
        const checkBtns = this.createCheckBtns(child);
        return checkBtns;
      case 'input':
        const input = this.createInput(child);
        return input;
      default:
        break;
    }
  }

  createPropertiesForm(options: Options) {
    const useLanguage = this.getUseLanguage();
    const { title, properties } = getProperties(options, useLanguage);
    const container = document.createElement('div');
    container.classList.add('ql-table-properties-form');
    const header = document.createElement('h2');
    const actions = this.createActionBtns(
      (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('button');
        target && this.checkBtnsAction(target.getAttribute('label'));
      },
      true
    );
    header.innerText = title;
    header.classList.add('properties-form-header');
    container.appendChild(header);
    for (const property of properties) {
      const node = this.createProperty(property);
      container.appendChild(node);
    }
    container.appendChild(actions);
    this.setBorderDisabled();
    this.tableMenus.quill.container.appendChild(container);
    this.updatePropertiesForm(container, options.type);
    this.setSaveButton(actions);
    container.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      this.hiddenSelectList(target);
    });
    return container;
  }

  getCellStyle(td: Element, attrs: Props) {
    const style = (td.getAttribute('style') || '')
      .split(';')
      .filter((value: string) => value.trim())
      .reduce((style: Props, value: string) => {
        const arr = value.split(':');
        return { ...style, [arr[0].trim()]: arr[1].trim() };
      }, {});
    Object.assign(style, attrs);
    return Object.keys(style).reduce((value: string, key: string) => {
      return value += `${key}: ${style[key]}; `;
    }, '');
  }

  getColorClosest(container: HTMLElement) {
    return getClosestElement(container, '.ql-table-color-container');
  }

  getComputeBounds(type: string) {
    if (type === 'table') {
      const { table } = this.tableMenus;
      const [tableBounds, containerBounds] = this.tableMenus.getCorrectBounds(table);
      if (tableBounds.bottom > containerBounds.bottom) {
        return { ...tableBounds, bottom: containerBounds.height };
      }
      return tableBounds;
    } else {
      const { computeBounds } = this.tableMenus.getSelectedTdsInfo();
      return computeBounds;
    }
  }

  getDiffProperties() {
    const change = this.attrs;
    const old = this.options.attribute;
    return Object.keys(change).reduce((attrs: Props, key) => {
      if (change[key] !== old[key]) {
        attrs[key] =
          isDimensions(key)
            ? addDimensionsUnit(change[key])
            : change[key];
      }
      return attrs;
    }, {});
  }

  getUseLanguage() {
    const { language } = this.tableMenus.tableBetter;
    const useLanguage = language.useLanguage.bind(language);
    return useLanguage;
  }

  getViewportSize() {
    return {
      viewWidth: document.documentElement.clientWidth,
      viewHeight: document.documentElement.clientHeight
    }
  }

  hiddenSelectList(element: HTMLElement) {
    const listClassName = '.ql-table-dropdown-properties';
    const colorClassName = '.color-picker';
    const list = this.form.querySelectorAll('.ql-table-dropdown-list');
    const colorPicker = this.form.querySelectorAll('.color-picker-select');
    for (const node of [...list, ...colorPicker]) {
      if (
        node.closest(listClassName)?.isEqualNode(element.closest(listClassName)) ||
        node.closest(colorClassName)?.isEqualNode(element.closest(colorClassName))
      ) {
        continue;
      }
      node.classList.add('ql-hidden');
    }
  }

  removePropertiesForm() {
    this.form.remove();
    this.borderForm = [];
  }

  // Sauvegarde selon le type Table/Cellule
  saveAction(type: string) {
    switch (type) {
      case 'table':
        this.saveTableAction();
        break;
      default:
        this.saveCellAction();
        break;
    }
  }

  /**
   * Logique de sauvegarde des propriétés des cellules.
   * Gère particulièrement les conflits avec le Drag&Drop manuel en forçant les styles.
   */
  saveCellAction() {
    const { selectedTds } = this.tableMenus.tableBetter.cellSelection;
    const { table } = this.tableMenus;

    // On supprime le min-width du tableau et de son attribut HTML
    table.style.removeProperty('min-width');
    table.style.minWidth = '0px';
    table.removeAttribute('width');

    // On supprime le min-width du PARENT (.ql-table-temporary)
    if (table.parentElement) {
      table.parentElement.style.removeProperty('min-width');
      table.parentElement.style.minWidth = '0px';
    }

    const attrs = this.getDiffProperties();
    const align = attrs['text-align'];
    const newWidth = attrs['width'];
    const newHeight = attrs['height'];

    // Récupération du SCALE (Zoom interne du WYSIWYG)
    const scale = this.tableMenus.tableBetter.scale || 1;

    align && delete attrs['text-align'];
    const newSelectedTds = [];

    // On récupère les dimensions, mais on va devoir les "dé-scaler"
    const tableBounds = table.getBoundingClientRect();

    let totalWidthDiff = 0;
    let requestedWidth: number | null = null;

    // Calcul de la largeur demandée et validation du minimum
    if (newWidth) {
      const floatW = parseFloat(newWidth);
      requestedWidth = newWidth.endsWith('%')
        ? floatW * getCorrectContainerWidth() / 100
        : floatW;

      const MIN_WIDTH = 30;
      if (requestedWidth < MIN_WIDTH) {
        requestedWidth = MIN_WIDTH;
        attrs['width'] = `${MIN_WIDTH}px`;
      }

      // On récupère le "Parent" des colonnes : la Première Ligne
      const firstRow = table.querySelector('tr');

      if (firstRow) {
        const colsToUpdate = new Map<number, HTMLElement>();

        for (const td of selectedTds) {
          const cellIndex = (td as HTMLTableCellElement).cellIndex;

          if (!colsToUpdate.has(cellIndex)) {
            const parentCell = firstRow.cells[cellIndex] as HTMLElement;

            if (parentCell) {
              const rect = parentCell.getBoundingClientRect();
              let currentParentWidth = rect.width / scale;

              const computed = window.getComputedStyle(parentCell);
              if (computed.boxSizing === 'content-box') {
                const pl = parseFloat(computed.paddingLeft) || 0;
                const pr = parseFloat(computed.paddingRight) || 0;
                const bl = parseFloat(computed.borderLeftWidth) || 0;
                const br = parseFloat(computed.borderRightWidth) || 0;
                currentParentWidth = currentParentWidth - pl - pr - bl - br;
              }

              // calcul des mesures
              totalWidthDiff += (requestedWidth - currentParentWidth);

              // On garde la cellule en mémoire pour la phase d'écriture
              colsToUpdate.set(cellIndex, parentCell);
            }
          }
        }

        // Maintenant que les calculs sont finis on l'applique sur le parent
        for (const parentCell of colsToUpdate.values()) {
          parentCell.style.width = attrs['width'];
          parentCell.setAttribute('width', attrs['width'].replace('px', ''));
          parentCell.style.removeProperty('min-width');
        }

        // On l'applique aussi sur les cellules sélectionnées
        for (const td of selectedTds) {
          const el = td as HTMLElement;
          el.style.width = attrs['width'];
          el.setAttribute('width', attrs['width'].replace('px', ''));
          el.style.removeProperty('min-width');
        }
      }
    }

    if (newHeight) {
      const processedRows = new Set<HTMLElement>();

      for (const td of selectedTds) {
        const row = td.parentElement as HTMLElement;

        if (row && row.tagName === 'TR' && !processedRows.has(row)) {

          // 1. ON NETTOIE LE STYLE CSS (C'est la clé !)
          // On retire le style height inline pour laisser la place au futur Drag & Drop
          row.style.removeProperty('height');
          row.style.removeProperty('min-height');

          // 2. ON APPLIQUE VIA L'ATTRIBUT HTML (Suffisant pour l'affichage, faible pour le conflit)
          if (!newHeight.endsWith('%')) {
            // L'attribut height définit la taille de base
            row.setAttribute('height', newHeight.replace('px', ''));
          } else {
            // Si c'est des %, on est obligé de passer par le style, mais sans important
            row.style.height = newHeight;
          }

          // 3. IDEM POUR LES CELLULES
          Array.from(row.children).forEach((cell: HTMLElement) => {
            // On nettoie le style CSS qui bloque
            cell.style.removeProperty('height');
            cell.style.removeProperty('min-height');

            // On applique via l'attribut
            if (!newHeight.endsWith('%')) {
              cell.setAttribute('height', newHeight.replace('px', ''));
            } else {
              cell.style.height = newHeight;
            }
          });

          processedRows.add(row);
        }
      }
    }

    for (const td of selectedTds) {
      const tdEl = td as HTMLElement;

      // Nettoyage cellule sélectionnée
      tdEl.style.removeProperty('min-width');

      // Remplacement du Blot Quill pour appliquer les formats
      const tdBlot = Quill.find(td) as TableCell;
      const blotName = tdBlot.statics.blotName;
      const formats = tdBlot.formats()[blotName];
      const style = this.getCellStyle(td, attrs);

      // Gestion de l'alignement
      if (align) {
        const _align = align === 'left' ? '' : align;
        tdBlot.children.forEach((child: TableCellBlock | ListContainer | TableHeader) => {
          if (child.statics.blotName === ListContainer.blotName) {
            child.children.forEach((ch: TableList) => {
              ch.format && ch.format('align', _align);
            });
          } else {
            child.format('align', _align);
          }
        });
      }

      const parent = tdBlot.replaceWith(blotName, { ...formats, style }) as TableCell;
      newSelectedTds.push(parent.domNode);
    }

    this.tableMenus.tableBetter.cellSelection.setSelectedTds(newSelectedTds);

    // Mise à jour de la largeur du tableau
    if (Math.abs(totalWidthDiff) > 0.1) {
      const unscaledBounds = {
        ...tableBounds,
        width: tableBounds.width / scale,
        height: tableBounds.height / scale
      } as DOMRect;

      updateTableWidthUtil(table, unscaledBounds, totalWidthDiff);


      table.style.removeProperty('min-width');
      table.style.minWidth = '0px';

      if (table.parentElement) {
        table.parentElement.style.removeProperty('min-width');
        table.parentElement.style.minWidth = '0px';
      }
    }
  }

  /**
   * Logique de sauvegarde des propriétés globales du tableau.
   * Utilise un RATIO de redimensionnement pour permettre la réduction du tableau
   */
  saveTableAction() {
    const { table, tableBetter } = this.tableMenus;
    const tableBlot = Quill.find(table) as TableContainer;
    const td = table.querySelector('td,th');
    const attrs = this.getDiffProperties();
    const scale = tableBetter.scale || 1;

    const MIN_COL_WIDTH = 30;
    const MIN_ROW_HEIGHT = 22;

    // compte les colonnes et lignes
    let colsCount = 0;
    const colgroup = tableBlot.colgroup();
    if (colgroup) {
      let col = colgroup.children.head;
      while (col) { colsCount++; col = col.next; }
    }
    if (colsCount === 0) {
      const firstRow = table.querySelector('tr');
      if (firstRow) colsCount = firstRow.children.length;
    }
    if (colsCount === 0) colsCount = 1;

    const REQUIRED_TABLE_WIDTH = colsCount * MIN_COL_WIDTH;

    const rows = table.querySelectorAll('tr');
    const rowsCount = rows.length || 1;
    const REQUIRED_TABLE_HEIGHT = rowsCount * MIN_ROW_HEIGHT;


    // On nettoie pour lire les vraies dimensions actuelles
    table.style.removeProperty('min-width');
    table.style.removeProperty('min-height');
    if (table.parentElement) {
      table.parentElement.style.removeProperty('min-width');
    }

    const currentTableRect = table.getBoundingClientRect();
    const currentVisualWidth = currentTableRect.width / scale;
    const currentVisualHeight = currentTableRect.height / scale;

    // Logique pour la largeur
    let targetWidthStr = this.attrs['width'];
    if (!targetWidthStr) targetWidthStr = table.style.width || table.getAttribute('width') || '100%';

    let finalWidthPx = 0;
    let isPercent = false;
    let forceResetMode = false;

    const rawW = parseFloat(targetWidthStr);
    if (!isNaN(rawW)) {
      if (!targetWidthStr.endsWith('%') && !targetWidthStr.endsWith('px')) targetWidthStr += 'px';
      isPercent = targetWidthStr.endsWith('%');
      const containerWidth = getCorrectContainerWidth();
      finalWidthPx = isPercent ? (rawW * containerWidth / 100) : rawW;

      if (finalWidthPx < REQUIRED_TABLE_WIDTH) {
        finalWidthPx = REQUIRED_TABLE_WIDTH;
        targetWidthStr = `${REQUIRED_TABLE_WIDTH}px`;
        isPercent = false;
        forceResetMode = true;
      }
      attrs['width'] = targetWidthStr;
    }

    let widthResizeRatio = 1;
    if (finalWidthPx > 0 && currentVisualWidth > 0) {
      widthResizeRatio = finalWidthPx / currentVisualWidth;
    }

    // Logique pour la hauteur
    let targetHeightStr = this.attrs['height'];
    let finalHeightPx = 0;

    // Si pas de hauteur définie, on ne touche à rien
    if (targetHeightStr) {
      const rawH = parseFloat(targetHeightStr);
      if (!isNaN(rawH)) {
        if (!targetHeightStr.endsWith('%') && !targetHeightStr.endsWith('px')) targetHeightStr += 'px';

        // Si c'est des px, on vérifie le minimum
        if (!targetHeightStr.endsWith('%')) {
          if (rawH < REQUIRED_TABLE_HEIGHT) {
            targetHeightStr = `${REQUIRED_TABLE_HEIGHT}px`;
            finalHeightPx = REQUIRED_TABLE_HEIGHT;
          } else {
            finalHeightPx = rawH;
          }
        } else {
          // Si %, on estime (moins précis mais fonctionnel)
          finalHeightPx = rawH;
        }
        attrs['height'] = targetHeightStr;
      }
    }

    let heightResizeRatio = 1;
    // On calcule le ratio seulement si on est en pixels (le % vertical est instable en édition)
    if (finalHeightPx > 0 && currentVisualHeight > 0 && !targetHeightStr.endsWith('%')) {
      heightResizeRatio = finalHeightPx / currentVisualHeight;
    }

    const align = attrs['align'];
    delete attrs['align'];
    switch (align) {
      case 'center': Object.assign(attrs, { 'margin': '0 auto' }); break;
      case 'left': Object.assign(attrs, { 'margin': '' }); break;
      case 'right': Object.assign(attrs, { 'margin-left': 'auto', 'margin-right': '' }); break;
    }

    const initialColWidths: { el: HTMLElement, w: number, minW: number, isCol: boolean }[] = [];

    let columnsToResize: HTMLElement[] = [];
    if (colgroup) {
      let col = colgroup.children.head;
      while (col) { columnsToResize.push(col.domNode as HTMLElement); col = col.next; }
    } else {
      const firstRow = table.querySelector('tr');
      if (firstRow) columnsToResize = Array.from(firstRow.children) as HTMLElement[];
    }

    // On stocke la vraie taille actuelle de chaque colonne AVANT toute modification
    columnsToResize.forEach(col => {
      const colspan = parseInt(col.getAttribute('colspan')) || 1;
      const minW = MIN_COL_WIDTH * colspan;
      const currentW = col.getBoundingClientRect().width / scale;
      initialColWidths.push({ el: col, w: currentW, minW: minW, isCol: col.tagName === 'COL' });
    });

    const initialRowHeights: { el: HTMLElement, h: number }[] = [];
    // On stocke la vraie taille de chaque ligne AVANT modification
    rows.forEach((row: HTMLElement) => {
      initialRowHeights.push({ el: row, h: row.getBoundingClientRect().height / scale });
    });

    const applyUpdates = () => {
      const { operateLine } = this.tableMenus.tableBetter;

      // Application ratio largeur
      if (initialColWidths.length > 0 && (forceResetMode || Math.abs(widthResizeRatio - 1) > 0.001)) {
        initialColWidths.forEach(item => {
          let newWStr = '';

          if (forceResetMode) {
            newWStr = `${item.minW}px`;
          } else {
            let newW = Math.round(item.w * widthResizeRatio);
            if (newW < item.minW) newW = item.minW;
            newWStr = `${newW}px`;
          }

          if (item.isCol) {
            operateLine.setColWidth(item.el, newWStr, false);
          } else {
            item.el.style.setProperty('width', newWStr, 'important');
            item.el.style.removeProperty('min-width');
            if (!newWStr.endsWith('%')) item.el.setAttribute('width', newWStr.replace('px', ''));
          }
        });
      }

      // Application ratio hauteur
      if (Math.abs(heightResizeRatio - 1) > 0.001) {
        initialRowHeights.forEach(item => {
          // Utilisation de "item.h" (la valeur mémorisée)
          let newH = Math.round(item.h * heightResizeRatio);
          if (newH < MIN_ROW_HEIGHT) newH = MIN_ROW_HEIGHT;

          const newHStr = `${newH}px`;

          item.el.setAttribute('height', String(newH));
          item.el.style.setProperty('height', newHStr, 'important');
          item.el.style.setProperty('max-height', newHStr, 'important');
          item.el.style.setProperty('min-height', '0px', 'important');

          Array.from(item.el.children).forEach((cell: HTMLElement) => {
            cell.setAttribute('height', String(newH));
            cell.style.setProperty('height', newHStr, 'important');
            cell.style.setProperty('max-height', newHStr, 'important');
            cell.style.setProperty('min-height', '0px', 'important');
          });
        });
      }

      // Application sur le conteneur Table Global
      const currentTemp = tableBlot.temporary()?.domNode;
      const targets = [table];
      if (currentTemp) targets.push(currentTemp);

      targets.forEach(target => {
        setElementProperty(target, attrs);

        if (attrs['width']) {
          const w = attrs['width'];
          target.style.setProperty('width', w, 'important');
          target.style.removeProperty('min-width');

          if (!w.endsWith('%')) {
            target.setAttribute('width', w.replace('px', ''));
          } else {
            target.setAttribute('width', w);
          }
        }
        if (attrs['height']) {
          const h = attrs['height'];
          target.style.setProperty('height', h, 'important');
          target.style.removeProperty('min-height');
          target.style.removeProperty('max-height');
          if (!h.endsWith('%')) target.setAttribute('height', h.replace('px', ''));
        }
      });
    };

    applyUpdates();
    setTimeout(() => {
      applyUpdates();
      if (td) tableBetter.cellSelection.setSelected(td);
    }, 0);
  }

  setAttribute(propertyName: string, value: string, container?: HTMLElement) {
    this.attrs[propertyName] = value;
    if (propertyName.includes('-color')) {
      this.updateSelectColor(this.getColorClosest(container), value);
    }
  }

  setBorderDisabled() {
    const [borderContainer] = this.borderForm;
    // @ts-ignore
    const borderStyle = borderContainer.querySelector('.ql-table-dropdown-text').innerText;
    this.toggleBorderDisabled(borderStyle);
  }

  setSaveButton(container: HTMLDivElement) {
    const saveButton: HTMLButtonElement = container.querySelector('button[label="save"]');
    this.saveButton = saveButton;
  }

  setSaveButtonDisabled(disabled: boolean) {
    if (!this.saveButton) return;
    if (disabled) {
      this.saveButton.setAttribute('disabled', 'true');
    } else {
      this.saveButton.removeAttribute('disabled');
    }
  }

  switchButton(container: HTMLDivElement, target: HTMLSpanElement) {
    const children = container.querySelectorAll('span.ql-table-tooltip-hover');
    for (const child of children) {
      child.classList.remove('ql-table-btns-checked');
    }
    target.classList.add('ql-table-btns-checked');
  }

  switchHidden(container: HTMLElement, valid: boolean) {
    if (!valid) {
      container.classList.remove('ql-hidden');
    } else {
      container.classList.add('ql-hidden');
    }
  }

  toggleBorderDisabled(value: string) {
    const [, colorContainer, widthContainer] = this.borderForm;
    if (value === 'none' || !value) {
      this.attrs['border-color'] = '';
      this.attrs['border-width'] = '';
      this.updateSelectColor(colorContainer, '');
      this.updateInputValue(widthContainer, '');
      colorContainer.classList.add('ql-table-disabled');
      widthContainer.classList.add('ql-table-disabled');
    } else {
      colorContainer.classList.remove('ql-table-disabled');
      widthContainer.classList.remove('ql-table-disabled');
    }
  }

  toggleHidden(container: HTMLElement) {
    container.classList.toggle('ql-hidden');
  }

  updateInputValue(element: Element, value: string) {
    const input: HTMLInputElement = element.querySelector('.property-input');
    input.value = value;
  }

  updateInputStatus(container: HTMLElement, status: boolean, isColor?: boolean) {
    const closestContainer =
      isColor
        ? this.getColorClosest(container)
        : getClosestElement(container, '.label-field-view');
    const wrapper = closestContainer.querySelector('.label-field-view-input-wrapper');
    if (status) {
      wrapper.classList.add('label-field-view-error');
      this.setSaveButtonDisabled(true);
    } else {
      wrapper.classList.remove('label-field-view-error');
      const wrappers = this.form.querySelectorAll('.label-field-view-error');
      if (!wrappers.length) this.setSaveButtonDisabled(false);
    }
  }

  updatePropertiesForm(container: HTMLElement, type: string) {
    container.classList.remove('ql-table-triangle-none');
    const { height, width } = container.getBoundingClientRect();
    const quillContainer = this.tableMenus.quill.container;
    const containerBounds = getCorrectBounds(quillContainer);
    const { top, left, right, bottom } = this.getComputeBounds(type);
    const { viewHeight } = this.getViewportSize();
    let correctTop = bottom + 10;
    let correctLeft = (left + right - width) >> 1;
    if (correctTop + containerBounds.top + height > viewHeight) {
      correctTop = top - height - 10;
      if (correctTop < 0) {
        correctTop = (containerBounds.height - height) >> 1;
        container.classList.add('ql-table-triangle-none');
      } else {
        container.classList.add('ql-table-triangle-up');
        container.classList.remove('ql-table-triangle-down');
      }
    } else {
      container.classList.add('ql-table-triangle-down');
      container.classList.remove('ql-table-triangle-up');
    }
    if (correctLeft < containerBounds.left) {
      correctLeft = 0;
      container.classList.add('ql-table-triangle-none');
    } else if (correctLeft + width > containerBounds.right) {
      correctLeft = containerBounds.right - width;
      container.classList.add('ql-table-triangle-none');
    }
    setElementProperty(container, {
      left: `${correctLeft}px`,
      top: `${correctTop}px`
    });
  }

  updateSelectColor(element: Element, value: string) {
    const input: HTMLInputElement = element.querySelector('.property-input');
    const colorButton: HTMLElement = element.querySelector('.color-button');
    const colorPickerSelect: HTMLElement = element.querySelector('.color-picker-select');
    const status: HTMLElement = element.querySelector('.label-field-view-status');
    if (!value) {
      colorButton.classList.add('color-unselected');
    } else {
      colorButton.classList.remove('color-unselected');
    }
    input.value = value;
    setElementProperty(colorButton, { 'background-color': value });
    colorPickerSelect.classList.add('ql-hidden');
    this.switchHidden(status, isValidColor(value));
  }

  updateSelectedStatus(container: HTMLDivElement, value: string, type: string) {
    const selectors = type === 'color' ? '.color-list' : '.ql-table-dropdown-list';
    const list = container.querySelector(selectors);
    if (!list) return;
    const lists = Array.from(list.querySelectorAll('li'));
    for (const list of lists) {
      list.classList.remove(`ql-table-${type}-selected`);
    }
    const selected = lists.find(li => {
      const data = type === 'color' ? li.getAttribute('data-color') : li.innerText;
      return data === value;
    });
    selected && selected.classList.add(`ql-table-${type}-selected`);
  }

  updateTableWidth(table: HTMLElement, tableBlot: TableContainer, isPercent: boolean) {
    const temporary = tableBlot.temporary();
    setElementProperty(table, { width: 'auto' });
    const { width } = table.getBoundingClientRect();
    table.style.removeProperty('width');
    setElementProperty(temporary.domNode, {
      width: getCorrectWidth(width, isPercent)
    });
  }
}

export default TablePropertiesForm;