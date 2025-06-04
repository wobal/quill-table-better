import Quill from 'quill';
import type {
  QuillTableBetter,
  TableCell,
  TableColgroup
} from '../types';
import {
  setElementProperty,
  setElementAttribute,
  updateTableWidth
} from '../utils';

interface Options {
  tableNode: HTMLElement;
  cellNode: HTMLElement;
  mousePosition: {
    clientX: number;
    clientY: number;
  }
}

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
    this.quill.root.addEventListener('mousemove', this.handleMouseMove.bind(this));    
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
    const scale = this.tableBetter.scale;
    let { left, top, width, height } = table.getBoundingClientRect();
    left = ~~((left / (scale * 100)) * 100);
    top = ~~((top / (scale * 100)) * 100);
    width = ~~((width / (scale * 100)) * 100);
    height = ~~((height / (scale * 100)) * 100);
    
    let containerRect = this.quill.container.getBoundingClientRect();
    let sContainerRect = {
      top: ~~((containerRect.top / (scale * 100)) * 100),
      left: ~~((containerRect.left / (scale * 100)) * 100)
    }
    
    return {
      left: `${left - sContainerRect.left}px`,
      top: `${top - sContainerRect.top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    }
  }

  getLevelColSum(cell: Element) {
    let previousNode = cell;
    let sum = 0;
    while (previousNode) {
      const colspan = ~~previousNode.getAttribute('colspan') || 1;
      sum += colspan;
      // @ts-ignore
      previousNode = previousNode.previousSibling;
    }
    return sum;
  }

  getMaxColNum(cell: Element) {
    const cells = cell.parentElement.children;
    let nums = 0;
    for (const cell of cells) {
      const colspan = ~~cell.getAttribute('colspan') || 1;
      nums += colspan;
    }
    return nums;
  }

  getProperty(options: Options) {
    const scale = this.tableBetter.scale;
    let containerRect = this.quill.container.getBoundingClientRect();
    let sContainerRect = {
      top: ~~((containerRect.top / (scale * 100)) * 100),
      bottom: ~~((containerRect.bottom / (scale * 100)) * 100),
      left: ~~((containerRect.left / (scale * 100)) * 100),
      height: ~~((containerRect.height / (scale * 100)) * 100),
      width: ~~((containerRect.width / (scale * 100)) * 100)
    }
    
    const { tableNode, cellNode, mousePosition } = options;
    let { clientX, clientY } = mousePosition;
    clientX = ~~((clientX / (scale * 100)) * 100);
    clientY = ~~((clientY / (scale * 100)) * 100);
    
    let tableRect = tableNode.getBoundingClientRect();
    let sTableRect = {
      right: ~~((tableRect.right / (scale * 100)) * 100),
      bottom: ~~((tableRect.bottom / (scale * 100)) * 100)
    };
    
    let cellRect = cellNode.getBoundingClientRect();
    let sCellRect = {
      left: ~~((cellRect.left / (scale * 100)) * 100),
      width: ~~((cellRect.width / (scale * 100)) * 100),
      top: ~~((cellRect.top / (scale * 100)) * 100),
      height: ~~((cellRect.height / (scale * 100)) * 100)
    };
    
    const x = sCellRect.left + sCellRect.width;
    const y = sCellRect.top + sCellRect.height;
    
    const dragBlockProps = {
      width: `${DRAG_BLOCK_WIDTH}px`,
      height: `${DRAG_BLOCK_HEIGHT}px`,
      top: `${sTableRect.bottom - sContainerRect.top}px`,
      left: `${sTableRect.right - sContainerRect.left}px`,
      display: sTableRect.bottom > sContainerRect.bottom ? 'none' : 'block'
    }

    if (Math.abs(x - clientX) <= 5) {
      this.direction = 'level';
      return {
        dragBlockProps,
        containerProps: {
          width: `${LINE_CONTAINER_WIDTH}px`,
          height: `${sContainerRect.height}px`,
          top: '0',
          left: `${x - sContainerRect.left - LINE_CONTAINER_WIDTH / 2}px`,
          display: 'flex',
          cursor: 'col-resize'
        },
        lineProps: {
          width: '1px',
          height: '100%'
        }
      }
    } else if (Math.abs(y - clientY) <= 5) {
      this.direction = 'vertical';
      return {
        dragBlockProps,
        containerProps: {
          width: `${sContainerRect.width}px`,
          height: `${LINE_CONTAINER_HEIGHT}px`,
          top: `${y - sContainerRect.top - LINE_CONTAINER_HEIGHT / 2}px`,
          left: '0',
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
    const tableNode = (e.target as Element).closest('table');
    const cellNode = (e.target as Element).closest('td');
    const mousePosition = {
      clientX: e.clientX,
      clientY: e.clientY
    }
    
    if (!tableNode || !cellNode) {
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
    const scale = this.tableBetter.scale;
    
    const { right } = cell.getBoundingClientRect();
    let change = ~~(clientX - right);
    const colSum = this.getLevelColSum(cell);
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    let bounds = tableBlot.domNode.getBoundingClientRect();
    if (colgroup) {
      const col = this.getCorrectCol(colgroup, colSum);
      const nextCol = col.next;
      const formats = col.formats()[col.statics.blotName];      
      let cWidth = ~~(((parseFloat(formats['width']) + change) / (scale * 100)) * 100);
      let sWidth = `${cWidth}`;
      
      col.domNode.setAttribute('width', sWidth);
      if (nextCol) {
        const nextFormats = nextCol.formats()[nextCol.statics.blotName];
        cWidth = ~~(((parseFloat(nextFormats['width']) - change) / (scale * 100)) * 100);
        sWidth = `${cWidth}`;
        
        nextCol.domNode.setAttribute('width', sWidth);
      }
    } else {
      const isLastCell = cell.nextElementSibling == null;
      const rows = cell.parentElement.parentElement.children;
      const preNodes: [Element, string][] = [];
      for (const row of rows) {
        const cells = row.children;
        if (isLastCell) {
          const cell = cells[cells.length - 1];
          const { width } = cell.getBoundingClientRect();          
          preNodes.push([cell, `${~~(width + change)}`]);
          continue;
        }
        let sum = 0;
        for (const cell of cells) {
          const colspan = ~~cell.getAttribute('colspan') || 1;
          sum += colspan;
          if (sum > colSum) break;
          if (sum === colSum) {
            const { width } = cell.getBoundingClientRect();
            const nextCell = cell.nextElementSibling;
            if (!nextCell) continue;
            const { width: nextWidth } = nextCell.getBoundingClientRect();
            preNodes.push([cell, `${~~(width + change)}`], [nextCell, `${~~(nextWidth - change)}`]);
          }
        }
      }
      for (let [node, width] of preNodes) {        
        let cWidth = ~~((parseFloat(width) / (scale * 100)) * 100);
        let sWidth = `${cWidth}px`;
        
        setElementAttribute(node, { width: cWidth.toString() });
        setElementProperty(node as HTMLElement, { width: sWidth });
      }
    }
    if (cell.nextElementSibling == null) {
      change = ~~((change / (scale * 100)) * 100);
      bounds.width = ~~((bounds.width / (scale * 100)) * 100);
      updateTableWidth(tableBlot.domNode, bounds, change);
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
    const scale = this.tableBetter.scale;
    const rows = cell.parentElement.parentElement.children;
    const maxColNum = this.getMaxColNum(cell);
    const averageX = changeX / maxColNum;   
    const averageY = changeY / rows.length;    
    const preNodes: [Element, string, string][] = [];
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    let bounds = tableBlot.domNode.getBoundingClientRect();
    for (const row of rows) {
      const cells = row.children;
      for (const cell of cells) {
        const colspan = ~~cell.getAttribute('colspan') || 1;
        const { width, height } = cell.getBoundingClientRect();
        preNodes.push([cell, `${Math.ceil(width + averageX * colspan)}`, `${Math.ceil(height + averageY)}`]);
      }
    }
    if (colgroup) {
      let col = colgroup.children.head;
      for (const [node, , height] of preNodes) {        
        let cHeight = ~~((parseFloat(height) / (scale * 100)) * 100);
        let sHeight = `${cHeight}px`;
        
        setElementAttribute(node, { height: cHeight.toString() });
        setElementProperty(node as HTMLElement, { height: sHeight });
      }
      while (col) {
        let { width } = col.domNode.getBoundingClientRect();
        width = ~~((width / (scale * 100)) * 100);
        
        setElementAttribute(col.domNode, { width: `${Math.ceil(width + averageX)}` });
        col = col.next;
      }
    } else {
      for (const [node, width, height] of preNodes) {        
        let cWidth = ~~((parseFloat(width) / (scale * 100)) * 100);
        let sWidth = `${cWidth}px`;
        let cHeight = ~~((parseFloat(height) / (scale * 100)) * 100);
        let sHeight = `${cHeight}px`;
        
        setElementAttribute(node, { width: cWidth.toString(), height: cHeight.toString() });
        setElementProperty(node as HTMLElement, {
          width: sWidth,
          height: sHeight
        });
      }
    }

    let change = ~~((changeX / (scale * 100)) * 100);
    bounds.width = ~~((bounds.width / (scale * 100)) * 100);
    
    updateTableWidth(tableBlot.domNode, bounds, change);
  }

  setCellVerticalRect(cell: Element, clientY: number) {
    const scale = this.tableBetter.scale;
    const rowspan = ~~cell.getAttribute('rowspan') || 1;
    const cells = rowspan > 1 ? this.getVerticalCells(cell, rowspan) : cell.parentElement.children;
    
    for (const cell of cells) {
      const { top } = cell.getBoundingClientRect();
      let sHeight = ~~((~~(clientY - top) / (scale * 100)) * 100);
      let cHeight = `${sHeight}px`;
       
      setElementAttribute(cell, { height: sHeight.toString() });
      setElementProperty(cell as HTMLElement, { height: cHeight });
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
    const scale = this.tableBetter.scale;
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
      this.drag = false;
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
      this.tableBetter.tableMenus.updateMenus(tableNode);
    }

    const handleMousedown = (e: MouseEvent) => {
      e.preventDefault();
      const { tableNode } = this.options;
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
    const scale = this.tableBetter.scale;
    let sClientX = ~~((clientX / (scale * 100)) * 100);
    let sClientY = ~~((clientY / (scale * 100)) * 100);
    
    let containerRect = this.quill.container.getBoundingClientRect();
    let sContainerRect = {
      top: ~~((containerRect.top / (scale * 100)) * 100),
      left: ~~((containerRect.left / (scale * 100)) * 100)
    };
    
    this.dragBlock.classList.add('ql-operate-block-move');
    setElementProperty(this.dragBlock, {
      top: `${~~(sClientY - sContainerRect.top - DRAG_BLOCK_HEIGHT / 2)}px`,
      left: `${~~(sClientX - sContainerRect.left - DRAG_BLOCK_WIDTH / 2)}px`
    });
    this.updateDragTable(clientX, clientY);
  }

  updateDragLine(clientX: number, clientY: number) {
    const scale = this.tableBetter.scale;
    let sClientX = ~~((clientX / (scale * 100)) * 100);
    let sClientY = ~~((clientY / (scale * 100)) * 100);
    
    let containerRect = this.quill.container.getBoundingClientRect();
    let sContainerRect = {
      top: ~~((containerRect.top / (scale * 100)) * 100),
      left: ~~((containerRect.left / (scale * 100)) * 100)
    };
    
    if (this.direction === 'level') {
      setElementProperty(this.line, { left: `${~~(sClientX - sContainerRect.left - LINE_CONTAINER_WIDTH / 2)}px` });
    } else if (this.direction === 'vertical') {
      setElementProperty(this.line, { top: `${~~(sClientY - sContainerRect.top - LINE_CONTAINER_HEIGHT / 2)}px` });
    }
  }

  updateDragTable(clientX: number, clientY: number) {
    const scale = this.tableBetter.scale;
    let sClientX = ~~((clientX / (scale * 100)) * 100);
    let sClientY = ~~((clientY / (scale * 100)) * 100);
    
    let { top, left } = this.dragTable.getBoundingClientRect();
    top = ~~((top / (scale * 100)) * 100);
    left = ~~((left / (scale * 100)) * 100);
    
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
