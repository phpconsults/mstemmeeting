/**
 * This script is responsible for transforming a table structure by copying attributes from the table wrapper to the table,
 * copying attributes from the table row wrapper to the table row, and copying attributes from the table cell wrapper to the table cell.
 * It also sets the headers attribute for each table cell based on the subheading, row heading, and column heading.
 * Finally, it replaces the table wrapper with the transformed table.
 */
(() => {
    // Selectors
    const SELECTORS = {
        OCR_TABLE: 'div.ocr-table',
        TABLE_ROW_WRAPPER: 'div.ocr-table-row',
        TABLE_CELL_WRAPPER: '.ocr-table-cell',
        TABLE: 'TABLE',
        TABLE_ROW: 'TR',
        TABLE_HEADER: 'TH',
        TABLE_CELL: 'TH,TD',
        TABLE_HEADER_ROW: 'THEAD TR',
        SUB_HEADING_ROW: 'ocr-table-row--subheading',
        THEAD: 'THEAD'
    }

    /**
     * copy all the attributes from the sourceElement to the targetElement
     * @param {HTMLElement} sourceElement - the source element
     * @param {HTMLElement} targetElement - the target element
     */
    function copyAttributes(sourceElement, targetElement) {
        for (const element of sourceElement.attributes) {
            const attr = element;
            if (attr.name === 'class') {
                targetElement.classList.add(...attr.value.split(' '));
            } else {
                targetElement.setAttribute(attr.name, attr.value);
            }
        }
    }

    /**
     * set the headers attribute for the cell
     * @param {HTMLElement} cell - the table cell element
     * @param {String} subHeadId - subheading id
     * @param {String} rowHeadId - row heading id
     * @param {String} colHeadId - column heading id
     */
    function setCellHeaders(cell, subHeadId, rowHeadId, colHeadId) {
        const headers = cell.tagName === SELECTORS.TABLE_HEADER ? subHeadId : subHeadId + ' ' + rowHeadId + ' ' + colHeadId;
        cell.setAttribute('headers', headers);
    }

    /**
     * get the id of the closest .ocr-table-row--subheading element before the current row
     * @param {HTMLElement} previousElementSibling - the previous element sibling
     * @returns 
     */
    function getSubHeadId(previousElementSibling) {
        while (previousElementSibling) {
            if (previousElementSibling.classList.contains(SELECTORS.SUB_HEADING_ROW)) {
                // Get the first TH element in previousElementSibling
                const firstTH = previousElementSibling.querySelector(SELECTORS.TABLE_HEADER);
                if (firstTH) {
                    return firstTH.id;
                } else {
                    return '';
                }
            } else {
                previousElementSibling = previousElementSibling.previousElementSibling;
            }
        }
        return '';
    }

    $(document).ready(function () {
        // Check if the table script is already executed, if yes then return
        if (document.querySelectorAll('div.ocr-table>.ocr-table__window>div').length === 0) return;
        const ocrTableWrappers = document.querySelectorAll(SELECTORS.OCR_TABLE);
        ocrTableWrappers.forEach((ocrTableWrapper) => {
            const table = ocrTableWrapper.querySelector(SELECTORS.TABLE);

            // get all the div.table-row elements in ocrTableWrapper
            const tableRows = ocrTableWrapper.querySelectorAll(SELECTORS.TABLE_ROW_WRAPPER);
            // get all the tr elements in table
            const tableRowElements = table.querySelectorAll(SELECTORS.TABLE_ROW);
            // for each div.table-row, copy all the attributes to the corresponding tr
			tableRows.forEach((tableRow, index) => {
                const tableRowElement = tableRowElements[index];
                copyAttributes(tableRow, tableRowElement);
                // delete this tableRow
                tableRow.remove();
            });

            // get all the .table-cell elements in ocrTableWrapper
			const tableCells = ocrTableWrapper.querySelectorAll(SELECTORS.TABLE_CELL_WRAPPER);
            // get all the th an td elements in table
            const cells = table.querySelectorAll(SELECTORS.TABLE_CELL);
            // for each .table-cell, copy all the attributes to the corresponding th or td
			tableCells.forEach((tableCell, index) => {
                const cell = cells[index];
                copyAttributes(tableCell, cell);

                // if the cell is a td add the headers attribute
				if (cell.parentElement.parentElement.tagName !== SELECTORS.THEAD && !cell.parentElement?.classList.contains(SELECTORS.SUB_HEADING_ROW)) {
                    // get the index of the cell in the row
					const cellIndex = Array.from(cell.parentElement.children).indexOf(cell);
                    // get the id of the cell in the thead row by this cellIndex
					const colHeadId = table.querySelector(SELECTORS.TABLE_HEADER_ROW)?.children[cellIndex].id;
					const currentRow = cell.parentElement;
                    // get the first TH element in current row
                    const rowHeadId = currentRow.querySelector(SELECTORS.TABLE_HEADER)?.id;
                    let previousElementSibling = currentRow.previousElementSibling;
                    // get the closest .orc-table-row--subheading element before this cell
                    const subHeadId = getSubHeadId(previousElementSibling);

                    // set the headers attribute when there is a subheading
                    if (subHeadId) {
                        // set the subHeadId, rowHeadId, and colHeadId to empty string if they are undefined
                        setCellHeaders(cell, subHeadId||'', rowHeadId||'', colHeadId||'');
                    }
                }

                // delete this tableCell
                tableCell.remove();
            });
        });
    });

})();
