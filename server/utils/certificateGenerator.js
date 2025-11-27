import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";

/**
 * Generates a PDF certificate and saves it to /certificates
 * @param {string} studentName - The student's full name
 * @param {string} courseTitle - The course name
 * @param {string} certificateId - A unique certificate ID
 * @returns {string} The file path of the generated certificate
 */
export const generateCertificate = async (studentName, courseTitle, certificateId) => {
  const certDir = path.resolve("certificates");
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

  const filename = `${certificateId}.pdf`;
  const filepath = path.join(certDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 50,
      });

      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // ===== Certificate Styling =====
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8f9fa");

      doc.fillColor("#333").fontSize(36).font("Helvetica-Bold");
      doc.text("Certificate of Completion", { align: "center", underline: true });

      doc.moveDown(2);
      doc.fontSize(20).font("Helvetica");
      doc.text("This certificate is proudly presented to", { align: "center" });

      doc.moveDown(1);
      doc.fontSize(32).font("Helvetica-Bold");
      doc.text(studentName, { align: "center" });

      doc.moveDown(1);
      doc.fontSize(20);
      doc.text("for successfully completing the course", { align: "center" });

      doc.moveDown(0.5);
      doc.fontSize(26).fillColor("#007bff");
      doc.text(courseTitle, { align: "center" });

      doc.moveDown(3);
      doc.fontSize(12).fillColor("#555");
      doc.text(`Certificate ID: ${certificateId}`, { align: "center" });
      doc.moveDown(0.5);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });

      doc.end();
      writeStream.on("finish", () => resolve(filepath));
    } catch (err) {
      reject(err);
    }
  });
};
