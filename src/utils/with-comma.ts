import Decimal from "decimal.js";

// 첫번째 .를 제외한 나머지 .를 지운다.
export function removeDotExceptFirstOne(value: string) {
  const output = value.split('.');
  return output.shift() + (output.length ? '.' + output.join('') : '');
}

// 숫자와 .를 제외한 나머지 문자를 지운다.
export function filterDecimal(value: string) {
  return value.replace(/[^\d\.]/g, '')
}

// 이제 fixNumber 만큼 유효 숫자를 표시함. value 끝에 .가 있는 경우 .를 남겨둔다. (폼에서 . 입력을 허용하기 위함)
function withComma(value?: number | string, fixNumber?: number): string {
  try {
    if (value === undefined || value === '') return '';
    if (typeof value === 'number' && isNaN(value)) return '';

    const input = typeof value === 'string' ? removeDotExceptFirstOne(filterDecimal(value)) : value
    const decimal = new Decimal(input);
    const hasDot = decimal.e < 0;

    if(!hasDot) return decimal.toString()

    // 0보다 작은 경우 유효숫자의 개수가 fixNumber만큼 노출되도록 수정
    const fixed = (hasDot && fixNumber) ? fixNumber + Math.min(0, -decimal.e - 1) : undefined;

    // 정수부
    const intPart = +new Decimal(decimal).trunc();
    // 소수부
    const decimalPart = new Decimal(decimal).sub(intPart).toFixed(fixed);

    return Number(intPart).toLocaleString() + decimalPart.slice(1)
  }
  catch (e) {
    return ''
  }
}

export default withComma;
