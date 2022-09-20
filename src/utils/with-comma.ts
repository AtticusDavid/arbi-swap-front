import Decimal from "decimal.js";

// 이제 fixNumber 만큼 유효 숫자를 표시함 
function withComma(value?: number | string, fixNumber?: number): string {
  if (value === undefined || value === '') return '';
  if(typeof value === 'number' && isNaN(value)) return '';

  const decimal = new Decimal(typeof value === 'string' ? value.replace(/[^\d\.]/g, '') : value);
  // 0보다 작은 경우 유효숫자의 개수가 fixNumber만큼 노출되도록 수정

  const fixed = fixNumber ? fixNumber + Math.max(0, -decimal.e-1) : undefined;

  // 정수부
  const intPart = +new Decimal(decimal).trunc();
  // 소수부
  const decimalPart = new Decimal(decimal).sub(intPart).toFixed(fixed);

  // console.log({intPart, decimalPart, fixed, fixNumber, exp: decimal.e})
  const result = Number(intPart).toLocaleString() + decimalPart.slice(1)
  return result;
}
// window.withComma = withComma;

export default withComma;