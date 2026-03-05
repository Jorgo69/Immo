import { Body, Controller, Post, UseGuards, Request, Param, Put, Get, Res, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { CreateLeaseCommand } from './commands/impl/create-lease.command/create-lease.command';
import { SignLeaseCommand } from './commands/impl/sign-lease.command/sign-lease.command';
import { GetMyLeasesQuery } from './queries/impl/get-my-leases.query/get-my-leases.query';
import { InvoicePdfService } from '../wallet/services/invoice-pdf.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceEntity } from '../wallet/entities/invoice.entity';
import { Repository } from 'typeorm';
import { LeaseEntity } from './entities/lease.entity';

@Controller('leases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly invoicePdfService: InvoicePdfService,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(LeaseEntity)
    private readonly leaseRepo: Repository<LeaseEntity>,
  ) {}

  @Get('my')
  async findAllMyLeases(@Request() req: any) {
    return this.queryBus.execute(new GetMyLeasesQuery(req.user.id));
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LANDLORD, UserRole.AGENT)
  async create(@Request() req: any, @Body() dto: CreateLeaseDto) {
    return this.commandBus.execute(
      new CreateLeaseCommand(
        req.user.id,
        dto.tenantId,
        dto.propertyId,
        dto.unitId || null,
        dto.monthlyRent,
        dto.depositAmount,
        dto.startDate,
        dto.endDate || null,
        dto.contractType,
        dto.contractContent,
      ),
    );
  }

  @Put(':id/sign')
  async sign(@Request() req: any, @Param('id') leaseId: string) {
    return this.commandBus.execute(new SignLeaseCommand(leaseId, req.user.id));
  }

  @Get('invoice/:id/pdf')
  async downloadInvoice(@Request() req: any, @Param('id') invoiceId: string, @Res() res: Response) {
    const invoice = await this.invoiceRepo.findOne({ 
      where: { id: invoiceId },
      relations: ['lease', 'lease.landlord', 'lease.landlord.profile', 'lease.tenant', 'lease.property'] 
    });

    if (!invoice) throw new NotFoundException('Facture non trouvée');
    
    // Sécurité : Seuls le locataire ou le propriétaire peuvent télécharger
    if (invoice.lease.tenant_id !== req.user.id && invoice.lease.landlord_id !== req.user.id) {
      throw new ForbiddenException('Accès refusé');
    }

    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoice, invoice.lease);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=quittance-${invoiceId.substring(0, 8)}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Put(':id/auto-debit')
  async toggleAutoDebit(
    @Request() req: any,
    @Param('id') leaseId: string,
    @Body('enabled') enabled: boolean,
  ) {
    const lease = await this.leaseRepo.findOne({ where: { id: leaseId, tenant_id: req.user.id } });
    if (!lease) throw new NotFoundException('Bail non trouvé ou accès refusé');
    
    lease.auto_debit_enabled = enabled;
    return this.leaseRepo.save(lease);
  }
}
