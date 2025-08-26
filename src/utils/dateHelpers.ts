export function formatRelativeDate(date: string): string {
  const now = new Date();
  const createdAt = new Date(date);
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} хв тому`;
  } else if (diffHours < 24) {
    return `${diffHours} год тому`;
  } else if (diffDays === 0) {
    return 'Сьогодні';
  } else if (diffDays === 1) {
    return 'Вчора';
  } else if (diffDays < 7) {
    return `${diffDays} дні тому`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} тижні тому`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} місяці тому`;
  }
}

export function formatPrice(price: number | null, currency: string = 'UAH'): string {
  if (!price) return 'Договірна';
  
  const formatter = new Intl.NumberFormat('uk-UA');
  const formattedPrice = formatter.format(price);
  
  if (currency === 'UAH') {
    return `${formattedPrice} грн`;
  } else if (currency === 'USD') {
    return `$${formattedPrice}`;
  } else if (currency === 'EUR') {
    return `€${formattedPrice}`;
  }
  
  return `${formattedPrice} ${currency}`;
}