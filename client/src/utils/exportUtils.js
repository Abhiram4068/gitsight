import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateExcelReport = async (insights, prNumberParam) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GitSight AI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('AI Code Review', {
      views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
    });

    // Define columns
    sheet.columns = [
      { header: 'File Path', key: 'filePath', width: 40 },
      { header: 'Line Range', key: 'lines', width: 15 },
      { header: 'Issue Type', key: 'type', width: 15 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'AI Comment', key: 'comment', width: 60 },
      { header: 'Current Code Snippet', key: 'currentCode', width: 50 },
      { header: 'Suggested Fix', key: 'suggestedFix', width: 50 }
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF374151' } // gray-700
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    const threads = insights?.issues || [];
    threads.forEach((issue) => {
      const row = sheet.addRow({
        filePath: issue.filePath,
        lines: `+${issue.startLine} to +${issue.endLine}`,
        type: issue.issueType,
        severity: issue.severity,
        comment: issue.comment,
        currentCode: issue.suggestedRemovedCode || '',
        suggestedFix: issue.suggestedAddedCode || ''
      });

      // Wrap text in long columns and align top
      row.alignment = { vertical: 'top', wrapText: true };
      
      // Color code severity column
      const severityCell = row.getCell('severity');
      severityCell.font = { bold: true };
      severityCell.alignment = { horizontal: 'center', vertical: 'top' };
      
      const severity = issue.severity?.toLowerCase() || '';
      if (severity === 'critical' || severity === 'high') {
        severityCell.font.color = { argb: 'FFDC2626' }; // red-600
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // red-100
      } else if (severity === 'medium' || severity === 'warning') {
        severityCell.font.color = { argb: 'FFD97706' }; // amber-600
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // amber-100
      } else {
        severityCell.font.color = { argb: 'FF4B5563' }; // gray-600
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // gray-100
      }

      // Style code columns with monospace
      row.getCell('currentCode').font = { name: 'Courier New', size: 10 };
      row.getCell('suggestedFix').font = { name: 'Courier New', size: 10 };
    });

    // Write to buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `PR-${prNumberParam}-AI-Review.xlsx`);
  } catch (error) {
    console.error("Failed to generate Excel report:", error);
    alert("Failed to generate Excel report.");
  }
};

export const generateTxtReport = (insights, prNumberParam) => {
  try {
    const threads = insights?.issues || [];
    let content = `AI Code Review Report - PR #${prNumberParam}\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;
    content += `=================================================\n\n`;

    threads.forEach((issue, idx) => {
      content += `Issue #${idx + 1}\n`;
      content += `File: ${issue.filePath}\n`;
      content += `Lines: +${issue.startLine} to +${issue.endLine}\n`;
      content += `Severity: ${issue.severity} | Type: ${issue.issueType}\n\n`;
      content += `Comment:\n${issue.comment}\n\n`;
      
      if (issue.suggestedRemovedCode) {
        content += `Current Code:\n${issue.suggestedRemovedCode}\n\n`;
      }
      if (issue.suggestedAddedCode) {
        content += `Suggested Fix:\n${issue.suggestedAddedCode}\n\n`;
      }
      content += `-------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `PR-${prNumberParam}-AI-Review.txt`);
  } catch (error) {
    console.error("Failed to generate TXT report:", error);
    alert("Failed to generate TXT report.");
  }
};

export const generatePdfReport = (insights, prNumberParam) => {
  try {
    const doc = new jsPDF('landscape');
    const threads = insights?.issues || [];

    doc.setFontSize(16);
    doc.text(`AI Code Review Report - PR #${prNumberParam}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = threads.map(issue => [
      issue.filePath,
      `+${issue.startLine} to +${issue.endLine}`,
      issue.severity,
      issue.issueType,
      issue.comment
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['File Path', 'Lines', 'Severity', 'Type', 'Comment']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [55, 65, 81] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' }
      }
    });

    doc.save(`PR-${prNumberParam}-AI-Review.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF report:", error);
    alert("Failed to generate PDF report.");
  }
};
