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
         doc.fontSize(20).text("INVOICE", { align: "right" });
         doc.moveDown();

         // Company Info
         doc.fontSize(12).text(data.companyName || "Aibar Booking", 50, 50);
         
         // Invoice Details
         doc.fontSize(10).text(`Invoice No: ${data.invoiceNumber}`, 400, 100);
         doc.text(`Date: ${data.date.toLocaleDateString()}`, 400, 115);

         doc.moveDown(2);

         // Customer Info
         doc.fontSize(12).text("Bill To:", 50, 150);
         doc.fontSize(10)
            .text(`Name: ${data.customerName}`, 50, 165)
            .text(`Phone: ${data.customerPhone}`, 50, 180);

         if (data.pickupAddress && data.destinationAddress) {
            doc.text(`From: ${data.pickupAddress}`, 50, 195);
            doc.text(`To: ${data.destinationAddress}`, 50, 210);
         }

         doc.moveDown(3);

         // Table Header
         const tableTop = 270;
         doc.font("Helvetica-Bold");
         doc.text("Description", 50, tableTop);
         doc.text("Amount (EUR)", 400, tableTop, { align: "right" });
         doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .stroke();
         doc.font("Helvetica");

         // Table Rows
         let y = tableTop + 25;
         data.items.forEach((item) => {
            doc.text(item.label, 50, y);
            doc.text(item.amount.toFixed(2), 400, y, { align: "right" });
            y += 20;
         });

         // Total
         doc.moveTo(50, y).lineTo(550, y).stroke();
         y += 15;
         doc.font("Helvetica-Bold");
         doc.text("Total", 50, y);
         doc.text(data.totalAmount.toFixed(2), 400, y, { align: "right" });

         // Footer
         doc.font("Helvetica");
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
