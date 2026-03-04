import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { PaymentGatewayType } from './entities/payment-gateway.entity';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('gateways')
  @ApiOperation({ summary: 'Lister les passerelles de paiement actives' })
  async getGateways() {
    return this.paymentService.getActiveGateways();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Générer un lien de paiement pour une passerelle spécifique' })
  async checkout(@Req() req, @Body() body: { gatewayId: string, amount: number, description: string }) {
    const url = await this.paymentService.createPayment(req.user.id, body.gatewayId, body.amount, body.description);
    return { url };
  }

  @Post('webhook/:type')
  @ApiOperation({ summary: 'Webhook universel pour les passerelles de paiement' })
  async webhook(@Param('type') type: PaymentGatewayType, @Body() payload: any) {
    const success = await this.paymentService.handleWebhook(type, payload);
    return { success };
  }
}
