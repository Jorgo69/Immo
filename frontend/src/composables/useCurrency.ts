import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getActiveCurrencies, type CurrencyRateDto } from '../services/currency.service';
import { useAppStore } from '../stores/app';

const rates = ref<CurrencyRateDto[]>([]);
const isLoadingRates = ref(false);

export function useCurrency() {
  const { locale } = useI18n();
  const appStore = useAppStore();

  // Initialize rates if empty
  async function loadRates() {
    if (rates.value.length > 0) return;
    isLoadingRates.value = true;
    try {
      const data = await getActiveCurrencies();
      rates.value = data;
    } catch (e) {
      console.error('Failed to load currency rates', e);
      // Fallback
      if (rates.value.length === 0) {
        rates.value = [{ id: 'fallback', currency_code: 'XOF', rate_to_cfa: 1, is_active: true, created_at: '', updated_at: '' }];
      }
    } finally {
      isLoadingRates.value = false;
    }
  }

  const currentCurrencyCode = computed({
    get: () => appStore.currency,
    set: (val: string) => appStore.setCurrency(val)
  });

  function setCurrency(code: string) {
    appStore.setCurrency(code);
  }

  const currentRate = computed(() => {
    return rates.value.find((r) => r.currency_code === appStore.currency) || 
           { rate_to_cfa: 1, currency_code: 'XOF', currency_symbol: 'FCFA' } as CurrencyRateDto;
  });

  const availableCurrencies = computed(() => {
    return rates.value.map(r => r.currency_code);
  });

  function formatPrice(amountInCfa: number): string {
    const rateItem = currentRate.value as CurrencyRateDto;
    const converted = amountInCfa / rateItem.rate_to_cfa;
    const isXof = rateItem.currency_code === 'XOF';

    const formattedDecimal = new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'decimal',
      maximumFractionDigits: isXof ? 0 : 2,
      minimumFractionDigits: isXof ? 0 : 2,
    }).format(converted);

    const symbol = rateItem.currency_symbol || rateItem.currency_code;
    // Affichage localisé : "10 000 FCFA" (fr) vs "FCFA10,000" (en)
    return locale.value === 'fr' ? `${formattedDecimal} ${symbol}` : `${symbol}${formattedDecimal}`;
  }

  return {
    rates,
    isLoadingRates,
    currentCurrencyCode,
    currentRate,
    availableCurrencies,
    loadRates,
    setCurrency,
    formatPrice,
  };
}
