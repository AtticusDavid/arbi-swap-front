export type Chain = 'evmos';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  iconFileExtension?: string;
  logoURI?: string;
}


   