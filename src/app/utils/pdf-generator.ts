import PDFDocument from "pdfkit";

interface IInvoiceData {
   invoiceNumber: string;
   date: Date;
   companyName?: string;
   customerName: string;
   customerPhone: string;
   pickupAddress?: string;
   destinationAddress?: string;
   items: { label: string; amount: number }[];
   totalAmount: number;
}

export const generateInvoicePDF = (data: IInvoiceData): Promise<Buffer> => {
   return new Promise((resolve, reject) => {
      try {
         const doc = new PDFDocument({ margin: 50 });
         const buffers: Buffer[] = [];

         doc.on("data", (buffer) => buffers.push(buffer));
         doc.on("end", () => resolve(Buffer.concat(buffers)));

         // Header
         doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", 50, 50, { align: "right" });
         
         // Company Info
         doc.fontSize(14).text(data.companyName || "Aibar Booking", 50, 55);
         doc.font("Helvetica");
         
         // Invoice Details
         doc.fontSize(10);
         doc.text(`Invoice No: ${data.invoiceNumber}`, 300, 95, { align: "right", width: 250 });
         doc.text(`Date: ${data.date.toLocaleDateString()}`, 300, doc.y + 2, { align: "right", width: 250 });

         // Customer Info
         const customerY = Math.max(150, doc.y + 30);
         doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", 50, customerY);
         doc.font("Helvetica").fontSize(10);
         doc.text(`Name: ${data.customerName}`, 50, doc.y + 3);
         doc.text(`Phone: ${data.customerPhone}`, 50, doc.y + 3);

         if (data.pickupAddress && data.destinationAddress) {
            doc.text(`From: ${data.pickupAddress}`, 50, doc.y + 5, { width: 300 });
            doc.text(`To: ${data.destinationAddress}`, 50, doc.y + 3, { width: 300 });
         }

         // Table Header
         const tableTop = doc.y + 40;
         doc.font("Helvetica-Bold");
         doc.text("Description", 50, tableTop);
         doc.text("Amount (EUR)", 400, tableTop, { align: "right", width: 150 });
         
         doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .lineWidth(1)
            .strokeColor("#cccccc")
            .stroke();
            
         doc.font("Helvetica").fillColor("#333333");

         // Table Rows
         let currentY = tableTop + 25;
         data.items.forEach((item) => {
            doc.text(item.label, 50, currentY, { width: 300 });
            const nextY = doc.y; // Y position after description wraps
            doc.text(item.amount.toFixed(2), 400, currentY, { align: "right", width: 150 });
            currentY = Math.max(nextY, currentY + 15) + 10;
         });

         // Total
         currentY += 10;
         doc.moveTo(50, currentY)
            .lineTo(550, currentY)
            .lineWidth(1)
            .strokeColor("#cccccc")
            .stroke();
            
         currentY += 15;
         doc.font("Helvetica-Bold").fillColor("#000000").fontSize(12);
         doc.text("Total", 50, currentY);
         doc.text(`€ ${data.totalAmount.toFixed(2)}`, 400, currentY, { align: "right", width: 150 });

         // Footer
         doc.font("Helvetica").fontSize(10).fillColor("#888888");
         doc.text(
            "Thank you for your business!",
            50,
            700,
            { align: "center", width: 500 },
         );

         doc.end();
      } catch (error) {
         reject(error);
      }
   });
};
