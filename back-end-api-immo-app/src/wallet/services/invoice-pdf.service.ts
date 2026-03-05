import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { InvoiceEntity } from '../entities/invoice.entity';
import { LeaseEntity } from '../../property/entities/lease.entity';

@Injectable()
export class InvoicePdfService {
  async generateInvoicePdf(invoice: InvoiceEntity, lease: LeaseEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .fontSize(20)
        .text('QUITTANCE DE LOYER', { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .text(`Date d'émission: ${new Date().toLocaleDateString('fr-BJ')}`, { align: 'right' })
        .text(`Facture N°: ${invoice.id.substring(0, 8).toUpperCase()}`, { align: 'right' })
        .moveDown();

      // Bailleur & Locataire side by side
      const yAfterHeader = doc.y;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BAILLEUR', 50, yAfterHeader);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`${lease.landlord?.email || 'N/A'}`)
        .text(`IFU: ${lease.landlord?.profile?.ifu_enc ? 'Vérifié' : 'Non renseigné'}`);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('LOCATAIRE', 300, yAfterHeader);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`${lease.tenant?.email || 'N/A'}`, 300)
        .moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

      // Property Details
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('OBJET DU BAIL')
        .font('Helvetica')
        .fontSize(10)
        .text(`Bien: ${lease.property?.name}`)
        .text(`Période: Du ${new Date(invoice.due_date).toLocaleDateString('fr-BJ')} au ...`)
        .moveDown();

      // Main Table
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Montant (XOF)', 450, tableTop, { align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica');
      doc.text('Loyer mensuel', 50, tableTop + 25);
      doc.text(`${invoice.amount.toLocaleString('fr-BJ')}`, 450, tableTop + 25, { align: 'right' });

      doc.moveTo(350, tableTop + 50).lineTo(550, tableTop + 50).stroke();

      doc.font('Helvetica-Bold');
      doc.text('TOTAL PAYÉ', 350, tableTop + 60);
      doc.text(`${invoice.amount.toLocaleString('fr-BJ')} XOF`, 450, tableTop + 60, { align: 'right' });

      // Footer / Legal notice
      doc
        .moveDown(4)
        .fontSize(8)
        .fillColor('grey')
        .text(
          'Cette quittance annule tout reçu à valoir précédemment délivré pour le paiement du loyer de la période sus-indiquée. ' +
          'En cas de paiement par chèque, la quittance n\'est valable que sous réserve d\'encaissement.',
          { align: 'center' }
        );

      doc.end();
    });
  }
}
