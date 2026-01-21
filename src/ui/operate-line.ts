import Quill from 'quill';
import type {
  QuillTableBetter,
  TableCell,
  TableColgroup
} from '../types';
import {
  getCorrectWidth,
  setElementProperty,
  setElementAttribute,
  updateTableWidth
} from '../utils';

interface Options {
  tableNode: HTMLElement;
  cellNode: Element;
  mousePosition: {
    clientX: number;
    clientY: number;
  }
}

const MIN_WIDTH = 30;
const MIN_HEIGHT = 22;
const TOUCH_TOLERANCE = 15;
const DRAG_BLOCK_HEIGHT = 8;
const DRAG_BLOCK_WIDTH = 8;
const LINE_CONTAINER_HEIGHT = 5;
const LINE_CONTAINER_WIDTH = 5;

class OperateLine {
  quill: Quill;
  options: Options | null;
  drag: boolean;
  line: HTMLElement | null;
  dragBlock: HTMLElement | null;
  dragTable: HTMLElement | null;
  direction: string | null;
  tableBetter: QuillTableBetter;
  constructor(quill: Quill, tableBetter?: QuillTableBetter) {
    this.quill = quill;
    this.options = null;
    this.drag = false;
    this.line = null;
    this.dragBlock = null;
    this.dragTable = null;
    this.direction = null; // 1.level 2.vertical
    this.tableBetter = tableBetter;
    this.quill.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  createDragBlock() {
    const dragBlock = document.createElement('div');
    dragBlock.classList.add('ql-operate-block');
    const { dragBlockProps } = this.getProperty(this.options);
    setElementProperty(dragBlock, dragBlockProps);
    this.dragBlock = dragBlock;
    this.quill.container.appendChild(dragBlock);
    this.updateCell(dragBlock);
  }

  createDragTable(table: Element) {
    const dragTable = document.createElement('div');
    const properties = this.getDragTableProperty(table);
    dragTable.classList.add('ql-operate-drag-table');
    setElementProperty(dragTable, properties);
    this.dragTable = dragTable;
    this.quill.container.appendChild(dragTable);
  }

  createOperateLine() {
    const container = document.createElement('div');
    const line = document.createElement('div');
    container.classList.add('ql-operate-line-container');
    const { containerProps, lineProps } = this.getProperty(this.options);

    setElementProperty(container, containerProps);
    setElementProperty(line, lineProps);
    container.appendChild(line);
    this.quill.container.appendChild(container);
    this.line = container;
    this.updateCell(container);
  }

  getCorrectCol(colgroup: TableColgroup, sum: number) {
    let child = colgroup.children.head;
    while (child && --sum) {
      child = child.next;
    }
    return child;
  }

  getDragTableProperty(table: Element) {
    const scale = this.tableBetter.scale || 1;
    const rect = table.getBoundingClientRect();
    const containerRect = this.quill.container.getBoundingClientRect();

    //Conversion simple à la place des scale * 100
    const width = Math.round(rect.width / scale);
    const height = Math.round(rect.height / scale);
    const left = Math.round((rect.left - containerRect.left) / scale);
    const top = Math.round((rect.top - containerRect.top) / scale)

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    }
  }

  getLevelColSum(cell: Element) {
    const row = cell.parentElement;
    // @ts-ignore
    if (!row || row.tagName !== 'TR') return 0;

    const table = row.closest('table') as HTMLTableElement;
    if (!table) return 0;

    // On récupère toutes les lignes pour reconstruire la structure virtuelle
    const rows = Array.from(table.rows);
    const targetRowIndex = rows.indexOf(row as HTMLTableRowElement);
    if (targetRowIndex === -1) return 0;

    // blockedUntil[colIdx] = Index de la ligne où la colonne se libère
    const blockedUntil: number[] = [];

    for (let r = 0; r <= targetRowIndex; r++) {
      const currentRow = rows[r];
      const cells = Array.from(currentRow.children) as Element[];
      let c = 0; // Index DOM (balise td)
      let colIdx = 0; // Index VISUEL (colonne grille)

      while (c < cells.length) {
        // 1. Sauter les colonnes visuelles occupées par une fusion verticale venant du haut
        while (blockedUntil[colIdx] > r) {
          colIdx++;
        }

        const currentCell = cells[c];
        const colspan = parseInt(currentCell.getAttribute('colspan')) || 1;
        const rowspan = parseInt(currentCell.getAttribute('rowspan')) || 1;

        // 2. Si c'est notre cellule cible, on retourne son index de FIN (bordure droite)
        if (currentCell === cell) {
          return colIdx + colspan;
        }

        // 3. Enregistrer le blocage pour les lignes futures si rowspan > 1
        if (rowspan > 1) {
          for (let k = 0; k < colspan; k++) {
            blockedUntil[colIdx + k] = r + rowspan;
          }
        }

        colIdx += colspan;
        c++;
      }
    }
    return 0;
  }

  // Utilise l'algo intelligent sur la 1ère ligne pour déterminer la largeur totale de la grille
  getMaxColNum(cell: Element) {
    const table = cell.closest('table') as HTMLTableElement;
    if (!table) return 0;
    const firstRow = table.rows[0];
    // @ts-ignore
    if (firstRow && firstRow.lastElementChild) {
      // @ts-ignore
      return this.getLevelColSum(firstRow.lastElementChild);
    }
    return 0;
  }

  getProperty(options: Options) {
    const scale = this.tableBetter.scale || 1;
    const containerRect = this.quill.container.getBoundingClientRect();
    const { tableNode, cellNode, mousePosition } = options;
    const tableRect = tableNode.getBoundingClientRect();
    const cellRect = cellNode.getBoundingClientRect();

    const toLogical = (val: number) => Math.round(val / scale);

    const sContainerRect = {
      left: toLogical(containerRect.left),
      top: toLogical(containerRect.top),
      width: toLogical(containerRect.width),
      height: toLogical(containerRect.height)
    };

    const sCellRect = {
      left: toLogical(cellRect.left),
      top: toLogical(cellRect.top),
      width: toLogical(cellRect.width),
      height: toLogical(cellRect.height)
    };

    const x = sCellRect.left + sCellRect.width;
    const y = sCellRect.top + sCellRect.height;

    const clientX = toLogical(mousePosition.clientX);
    const clientY = toLogical(mousePosition.clientY);

    const sTableRect = {
      right: toLogical(tableRect.right),
      bottom: toLogical(tableRect.bottom)
    }

    const dragBlockProps = {
      width: `${DRAG_BLOCK_WIDTH}px`,
      height: `${DRAG_BLOCK_HEIGHT}px`,
      top: `${sTableRect.bottom - sContainerRect.top}px`,
      left: `${sTableRect.right - sContainerRect.left}px`,
      display: 'block'
    }

    if (Math.abs(x - clientX) <= TOUCH_TOLERANCE) {
      this.direction = 'level';
      return {
        dragBlockProps,
        containerProps: {
          width: `${LINE_CONTAINER_WIDTH}px`,
          height: `${sCellRect.height}px`,
          top: `${sCellRect.top - sContainerRect.top}px`,
          left: `${x - sContainerRect.left - LINE_CONTAINER_WIDTH / 2}px`,
          display: 'flex',
          cursor: 'col-resize'
        },
        lineProps: {
          width: '1px',
          height: '100%'
        }
      }
    } else if (Math.abs(y - clientY) <= TOUCH_TOLERANCE) {
      this.direction = 'vertical';
      return {
        dragBlockProps,
        containerProps: {
          width: `${sCellRect.width}px`,
          height: `${LINE_CONTAINER_HEIGHT}px`,
          top: `${y - sContainerRect.top - LINE_CONTAINER_HEIGHT / 2}px`,
          left: `${sCellRect.left - sContainerRect.left}px`,
          display: 'flex',
          cursor: 'row-resize'
        },
        lineProps: {
          width: '100%',
          height: '1px'
        }
      }
    } else {
      this.hideLine();
    }
    return { dragBlockProps };
  }

  getVerticalCells(cell: Element, rowspan: number) {
    let row = cell.parentElement;
    while (rowspan > 1 && row) {
      // @ts-ignore
      row = row.nextSibling;
      rowspan--;
    }
    return row.children;
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.quill.isEnabled()) return;

    const target = e.target as Element;

    if (
      target === this.dragBlock ||
      (this.line && this.line.contains(target)) ||
      target.classList.contains('ql-operate-block') ||
      target.classList.contains('ql-operate-line-container')
    ) {
      return;
    }

    const tableNode = target.closest('table');
    if (tableNode && !this.quill.root.contains(tableNode)) return;
    const cellNode = target.closest('td,th');
    const mousePosition = {
      clientX: e.clientX,
      clientY: e.clientY
    }

    if (!tableNode || !cellNode) {
      if (this.options && this.options.tableNode) {
        const rect = this.options.tableNode.getBoundingClientRect();
        const dist = Math.sqrt(
          Math.pow(e.clientX - rect.right, 2) +
          Math.pow(e.clientY - rect.bottom, 2)
        );

        if (dist < 40) {
          return;
        }
      }

      if (this.line && !this.drag && this.options) {
        const extendedOptions = {
          tableNode: this.options.tableNode,
          cellNode: this.options.cellNode,
          mousePosition
        };

        const { containerProps } = this.getProperty(extendedOptions);

        if (containerProps) {
          this.updateProperty(extendedOptions);
          return;
        }
      }

      if (this.line && !this.drag) {
        this.hideLine();
        this.hideDragBlock();
      }
      return;
    }

    const options = { tableNode, cellNode, mousePosition };
    if (!this.line) {
      this.options = options;
      this.createOperateLine();
      this.createDragBlock();
    } else {
      if (this.drag || !cellNode) return;
      this.updateProperty(options);
    }
  }

  hideDragBlock() {
    this.dragBlock && setElementProperty(this.dragBlock, { display: 'none' });
  }

  hideDragTable() {
    this.dragTable && setElementProperty(this.dragTable, { display: 'none' });
  }

  hideLine() {
    this.line && setElementProperty(this.line, { display: 'none' });
  }

  isLine(node: Element) {
    return node.classList.contains('ql-operate-line-container');
  }

  setCellLevelRect(cell: Element, clientX: number) {
    const scale = this.tableBetter.scale || 1;
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const isPercent = tableBlot.isPercent();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    // @ts-ignore
    const colSum = this.getLevelColSum(cell);
    let bounds = tableBlot.domNode.getBoundingClientRect();

    const applyWidth = (node: Element, logicalW: number) => {
      const w = Math.round(logicalW);
      setElementAttribute(node, { width: String(w) });
      const sWidth = isPercent ? getCorrectWidth(w, isPercent) : `${w}px`;
      setElementProperty(node as HTMLElement, { width: sWidth });

      // On synchro width et min-width pour forcer le respect de la taille par le navigateur et eviter des bugs avec les border
      if (!isPercent) {
        (node as HTMLElement).style.setProperty('width', sWidth, 'important');
        (node as HTMLElement).style.removeProperty('min-width');
      }
    };

    if (colgroup) {
      const col = this.getCorrectCol(colgroup, colSum);
      const nextCol = col.next;
      const { left: colLeft } = col.domNode.getBoundingClientRect();

      if (!nextCol) {
        let newW = Math.round((clientX - colLeft) / scale);
        if (newW < MIN_WIDTH) newW = MIN_WIDTH;

        let currentAttrW = parseInt(col.domNode.getAttribute('width'));
        let oldW = !isNaN(currentAttrW) ? currentAttrW : Math.round(col.domNode.getBoundingClientRect().width / scale);
        let diff = newW - oldW;

        if (diff !== 0) {
          applyWidth(col.domNode, newW);
          bounds.width = bounds.width / scale;
          const tableNode = tableBlot.domNode;
          const newTotalW = bounds.width + diff;
          updateTableWidth(tableNode, bounds, diff);
          tableNode.style.setProperty('min-width', `${newTotalW}px`, 'important');
        }
        return;
      }

      const rectB = nextCol.domNode.getBoundingClientRect();
      const w1Visual = col.domNode.getBoundingClientRect().width;
      const w2Visual = rectB.width;
      const totalLogical = Math.round((w1Visual + w2Visual) / scale);

      let newW1 = Math.round((clientX - colLeft) / scale);

      if (newW1 < MIN_WIDTH) newW1 = MIN_WIDTH;
      if (newW1 > totalLogical - MIN_WIDTH) newW1 = totalLogical - MIN_WIDTH;

      let newW2 = totalLogical - newW1;

      applyWidth(col.domNode, newW1);
      applyWidth(nextCol.domNode, newW2);

    } else {
      const tableNode = tableBlot.domNode as HTMLTableElement;
      const maxCols = this.getMaxColNum(cell);
      const cellEndIndex = this.getLevelColSum(cell);

      // On vérifie via l'algo intelligent si c'est la bordure de FIN de tableau
      const isLastVisualColumn = cellEndIndex >= maxCols;

      if (isLastVisualColumn) {
        // Redimensionnement de la table entière
        const { left: colLeft } = cell.getBoundingClientRect();
        let newW = Math.round((clientX - colLeft) / scale);
        if (newW < MIN_WIDTH) newW = MIN_WIDTH;

        const firstCell = cell;
        let currentAttrW = parseInt(firstCell.getAttribute('width'));
        let oldW = !isNaN(currentAttrW) ? currentAttrW : Math.round(firstCell.getBoundingClientRect().width / scale);
        let diff = newW - oldW;

        bounds.width = bounds.width / scale;
        const newTotalW = bounds.width + diff;
        updateTableWidth(tableNode, bounds, diff);
        tableNode.style.setProperty('min-width', `${newTotalW}px`, 'important');

        // Cast en HTMLTableElement pour avoir .rows
        const rows = Array.from(tableNode.rows);
        const blockedUntil: number[] = [];

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const cells = Array.from(row.children) as Element[];
          let c = 0;
          let colIdx = 0;
          while (c < cells.length) {
            while (blockedUntil[colIdx] > r) colIdx++;
            const currentCell = cells[c];
            const colspan = parseInt(currentCell.getAttribute('colspan')) || 1;
            const rowspan = parseInt(currentCell.getAttribute('rowspan')) || 1;
            if (rowspan > 1) {
              for (let k = 0; k < colspan; k++) blockedUntil[colIdx + k] = r + rowspan;
            }

            // Identification des voisins autour de la bordure bougée
            if (colIdx + colspan >= maxCols) {
              applyWidth(currentCell, newW);
            }
            colIdx += colspan;
            c++;
          }
        }
      }
      else {
        const rows = Array.from(tableNode.rows);
        const blockedUntil: number[] = [];

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const cells = Array.from(row.children) as Element[];
          let c = 0;
          let colIdx = 0;

          let leftCell: Element | null = null;
          let rightCell: Element | null = null;

          while (c < cells.length) {
            while (blockedUntil[colIdx] > r) colIdx++;
            const currentCell = cells[c];
            const colspan = parseInt(currentCell.getAttribute('colspan')) || 1;
            const rowspan = parseInt(currentCell.getAttribute('rowspan')) || 1;
            if (rowspan > 1) {
              for (let k = 0; k < colspan; k++) blockedUntil[colIdx + k] = r + rowspan;
            }

            if (colIdx + colspan === colSum) {
              leftCell = currentCell;
            }
            if (colIdx === colSum) {
              rightCell = currentCell;
            }

            colIdx += colspan;
            c++;
          }

          if (leftCell && rightCell) {
            const { left: cLeft, width: w1V } = leftCell.getBoundingClientRect();
            const { width: w2V } = rightCell.getBoundingClientRect();

            const totalLogical = Math.round((w1V + w2V) / scale);
            let newW1 = Math.round((clientX - cLeft) / scale);

            if (newW1 < MIN_WIDTH) newW1 = MIN_WIDTH;
            if (newW1 > totalLogical - MIN_WIDTH) newW1 = totalLogical - MIN_WIDTH;

            let newW2 = totalLogical - newW1;

            applyWidth(leftCell, newW1);
            applyWidth(rightCell, newW2);
          }
          else if (leftCell && !rightCell) {
            const { left: cLeft } = leftCell.getBoundingClientRect();
            let newW = Math.round((clientX - cLeft) / scale);
            if (newW < MIN_WIDTH) newW = MIN_WIDTH;
            applyWidth(leftCell, newW);
          }
        }
      }
    }
  }

  setCellRect(cell: Element, clientX: number, clientY: number) {
    if (this.direction === 'level') {
      this.setCellLevelRect(cell, clientX);
    } else if (this.direction === 'vertical') {
      this.setCellVerticalRect(cell, clientY);
    }
  }

  setCellsRect(cell: Element, changeX: number, changeY: number) {
    const scale = this.tableBetter.scale || 1;
    const rows = cell.parentElement.parentElement.children;
    const maxColNum = this.getMaxColNum(cell);
    const averageX = changeX / maxColNum;
    const averageY = changeY / rows.length;
    // on remplace Element, string, string par number pour pouvoir faire le calcul de pixel pour le "preNodes.push"
    const preNodes: [Element, number, number][] = [];
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const isPercent = tableBlot.isPercent();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    let bounds = tableBlot.domNode.getBoundingClientRect();

    for (const row of rows) {
      const cells = row.children;
      for (const cell of cells) {
        const colspan = ~~cell.getAttribute('colspan') || 1;
        const { width, height } = cell.getBoundingClientRect();
        preNodes.push([cell, width + averageX * colspan, height + averageY]);
      }
    }

    // Conversion en pixels logique
    if (colgroup) {
      let col = colgroup.children.head;

      // Nouveau calcul pour les hauteurs
      for (const [node, , height] of preNodes) {
        // Division par le scale 
        let cHeight = Math.round(height / scale);
        if (cHeight < MIN_HEIGHT) cHeight = MIN_HEIGHT;

        setElementAttribute(node, { height: String(cHeight) });
        setElementProperty(node as HTMLElement, { height: `${cHeight}px` });
      }
      // Maj des largeurs
      while (col) {
        let { width } = col.domNode.getBoundingClientRect();
        // On ajoute la part de changement (averageX) au width écran, puis on scale
        let newColWidth = Math.round((width + averageX) / scale);
        if (newColWidth < MIN_WIDTH) newColWidth = MIN_WIDTH;

        this.setColWidth(col.domNode, String(newColWidth), isPercent);
        col = col.next;
      }
    } else {
      // Tableau sans colgroup
      for (const [node, width, height] of preNodes) {
        const correctWidth = getCorrectWidth(Math.round(width), isPercent);
        // Conversion en px logique
        let cWidth = Math.round(width / scale);
        let cHeight = Math.round(height / scale);

        if (cWidth < MIN_WIDTH) cWidth = MIN_WIDTH;
        if (cHeight < MIN_HEIGHT) cHeight = MIN_HEIGHT;

        const sWidth = isPercent ? getCorrectWidth(cWidth, isPercent) : `${cWidth}px`;
        const sHeight = `${cHeight}px`;

        setElementAttribute(node, { width: String(cWidth), height: String(cHeight) });

        const el = node as HTMLElement;
        setElementProperty(el, { width: sWidth, height: sHeight });
        if (!isPercent) {
          el.style.setProperty('width', sWidth, 'important');
          el.style.removeProperty('min-width');
        }
      }
    }

    // Maj de la largeur totale du tableau
    // On convertit le changement X en logique pour l'appliquer à la largeur actuelle
    const logicalChangeX = Math.round(changeX / scale);

    // On récupère la largeur logique actuelle via style ou attribut pour éviter les erreurs de scale inverse
    const currentTableWidth = Math.round(bounds.width / scale);
    const logicalBounds = { ...bounds, width: currentTableWidth };

    const tableNode = tableBlot.domNode;
    const newTotalW = currentTableWidth + logicalChangeX;

    updateTableWidth(tableNode, logicalBounds, logicalChangeX);
    tableNode.style.setProperty('min-width', `${newTotalW}px`, 'important');
  }

  setColWidth(domNode: HTMLElement, width: string, isPercent: boolean) {
    if (isPercent) {
      width = getCorrectWidth(parseFloat(width), isPercent);
      domNode.style.setProperty('width', width);
    } else {
      setElementAttribute(domNode, { width });
      domNode.style.setProperty('width', `${width}px`, 'important');
      domNode.style.removeProperty('min-width');
    }
  }

  setCellVerticalRect(cell: Element, clientY: number) {
    const scale = this.tableBetter.scale || 1;
    const rowspan = ~~cell.getAttribute('rowspan') || 1;

    // 1. Récupération des cellules cibles
    // Si on resize une cellule fusionnée (rowspan > 1), on cible la dernière ligne de son extension.
    // Sinon, on cible la ligne actuelle.
    const cellsCollection = rowspan > 1 ? this.getVerticalCells(cell, rowspan) : cell.parentElement.children;
    const cells = Array.from(cellsCollection) as HTMLElement[];

    // 2. Récupération de la ligne parente (TR)
    // Attention : Si rowspan > 1, 'cells' contient les cellules de la ligne du BAS. 
    // Il faut récupérer le TR de cette ligne du bas, pas celui de la cellule de départ.
    const row = cells[0].parentElement as HTMLElement;

    const { top: rowTop } = row.getBoundingClientRect();

    //  Calcul de la nouvelle hauteur LOGIQUE
    let newHeight = Math.round((clientY - rowTop) / scale);

    if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;


    // A. On force la ligne (TR) à la nouvelle hauteur.
    setElementAttribute(row, { height: String(newHeight) });
    row.style.setProperty('height', `${newHeight}px`, 'important');

    // B. On applique la hauteur aux cellules, mais on filtre.
    for (const c of cells) {
      const cRowspan = ~~c.getAttribute('rowspan') || 1;


      // On ne modifie que les cellules qui sont "contenues" dans cette ligne.
      if (rowspan === 1 && cRowspan > 1) {
        continue;
      }

      setElementAttribute(c, { height: String(newHeight) });
      c.style.setProperty('height', `${newHeight}px`, 'important');
    }
  }

  toggleLineChildClass(isAdd: boolean) {
    const node = this.line.firstElementChild;
    if (isAdd) {
      node.classList.add('ql-operate-line');
    } else {
      node.classList.remove('ql-operate-line');
    }
  }

  updateCell(node: Element) {
    if (!node) return;
    const isLine = this.isLine(node);
    const scale = this.tableBetter.scale; // je le garde au cas ou j'en au besoin
    const handleDrag = (e: MouseEvent) => {
      e.preventDefault();

      if (this.drag) {
        if (isLine) {
          this.updateDragLine(e.clientX, e.clientY);
          this.hideDragBlock();
        } else {
          this.updateDragBlock(e.clientX, e.clientY);
          this.hideLine();
        }
      }
    }

    const handleMouseup = (e: MouseEvent) => {
      e.preventDefault();
      const { cellNode, tableNode } = this.options;

      if (isLine) {
        this.setCellRect(cellNode, e.clientX, e.clientY);
        this.toggleLineChildClass(false);
      } else {
        const { right, bottom } = tableNode.getBoundingClientRect();
        const changeX = e.clientX - right;
        const changeY = e.clientY - bottom;
        this.setCellsRect(cellNode, changeX, changeY);
        this.dragBlock.classList.remove('ql-operate-block-move');
        this.hideDragBlock();
        this.hideDragTable();
      }

      // Une fois le drag fini, on repose le filet de sécurité via un setTimeout
      setTimeout(() => {
        if (tableNode) {
          const colsCount = this.getMaxColNum(cellNode);
          const safeMinW = colsCount * MIN_WIDTH;
          tableNode.style.setProperty('min-width', `${safeMinW}px`, 'important');
        }
      }, 0);

      this.drag = false;
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
      this.tableBetter.tableMenus.updateMenus(tableNode);
    }

    const handleMousedown = (e: MouseEvent) => {
      e.preventDefault();
      const { tableNode } = this.options;

      // On retire le min-width au clic pour permettre le rétrécissement
      if (tableNode) {
        tableNode.style.removeProperty('min-width');
      }

      if (isLine) {
        this.toggleLineChildClass(true);
      } else {
        if (this.dragTable) {
          const properties = this.getDragTableProperty(tableNode);
          setElementProperty(this.dragTable, properties);
        } else {
          this.createDragTable(tableNode);
        }
      }
      this.drag = true;
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleMouseup);
    }
    node.addEventListener('mousedown', handleMousedown);
  }

  updateDragBlock(clientX: number, clientY: number) {
    const scale = this.tableBetter.scale || 1;

    // Conversion Souris écran --> Souris Logique
    const sClientX = Math.round(clientX / scale);
    const sClientY = Math.round(clientY / scale);

    const containerRect = this.quill.container.getBoundingClientRect();
    const sContainerRect = {
      top: Math.round(containerRect.top / scale),
      left: Math.round(containerRect.left / scale)
    };

    this.dragBlock.classList.add('ql-operate-block-move');
    setElementProperty(this.dragBlock, {
      top: `${sClientY - sContainerRect.top - DRAG_BLOCK_HEIGHT / 2}px`,
      left: `${sClientX - sContainerRect.left - DRAG_BLOCK_WIDTH / 2}px`
    });
    this.updateDragTable(clientX, clientY);
  }

  updateDragLine(clientX: number, clientY: number) {
    const scale = this.tableBetter.scale || 1;

    // Conversion (toujours la même chose normalement ça devrait aller pour comprendre)
    const sClientX = Math.round(clientX / scale);
    const sClientY = Math.round(clientY / scale);

    const containerRect = this.quill.container.getBoundingClientRect();
    const sContainerRect = {
      top: Math.round(containerRect.top / scale),
      left: Math.round(containerRect.left / scale)
    };

    if (this.direction === 'level') {
      setElementProperty(this.line, {
        left: `${sClientX - sContainerRect.left - LINE_CONTAINER_WIDTH / 2}px`
      });
    } else if (this.direction === 'vertical') {
      setElementProperty(this.line, {
        top: `${sClientY - sContainerRect.top - LINE_CONTAINER_HEIGHT / 2}px`
      });
    }
  }

  updateDragTable(clientX: number, clientY: number) {
    const scale = this.tableBetter.scale || 1;
    const sClientX = Math.round(clientX / scale);
    const sClientY = Math.round(clientY / scale);

    let { top, left } = this.dragTable.getBoundingClientRect();
    top = Math.round(top / scale);
    left = Math.round(left / scale);

    const width = sClientX - left;
    const height = sClientY - top;

    setElementProperty(this.dragTable, {
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    });
  }

  updateProperty(options: Options) {
    const { containerProps, lineProps, dragBlockProps } = this.getProperty(options);
    if (!containerProps || !lineProps) return;
    this.options = options;
    setElementProperty(this.line, containerProps);
    setElementProperty(this.line.firstChild as HTMLElement, lineProps);
    setElementProperty(this.dragBlock, dragBlockProps);
  }
}

export default OperateLine;