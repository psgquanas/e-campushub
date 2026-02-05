import jsPDF from "jspdf";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function exportChatToPDF(
  messages: Message[],
  title: string,
  subject: string,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (yPosition + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, yPosition);
  yPosition += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Subject: ${subject}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Messages: ${messages.length}`, margin, yPosition);
  yPosition += 15;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Messages
  messages.forEach((message, index) => {
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    // Role and timestamp header
    const header = `${message.role === "user" ? "You" : "AI Assistant"} - ${message.timestamp.toLocaleString()}`;

    checkPageBreak(20);
    doc.text(header, margin, yPosition);
    yPosition += 7;

    // Message content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Clean markdown-style content
    const cleanContent = message.content
      .replace(/```[\s\S]*?```/g, "[Code Block]") // Replace code blocks
      .replace(/`([^`]+)`/g, "$1") // Remove inline code formatting
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^*]+)\*/g, "$1") // Remove italics
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); // Remove links, keep text

    const lines = doc.splitTextToSize(cleanContent, maxWidth);

    lines.forEach((line: string) => {
      checkPageBreak(7);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 8;

    // Draw separator between messages
    if (index < messages.length - 1) {
      checkPageBreak(5);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });

  // Save the PDF
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getTime()}.pdf`;
  doc.save(filename);
}
