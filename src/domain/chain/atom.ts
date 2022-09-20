import { atom } from 'jotai';

import evmosTokenListJson from 'src/constant/token-list/evmos.json';

import { tokenInAddressAtom, tokenOutAddressAtom } from '../swap/atom';
import { Chain, Token } from './types';

const tokenListMap: Record<Chain, Token[]> = {
  evmos: evmosTokenListJson.result,
};

export const chainList: Chain[] = [
  'evmos',
];

export const defaultChain: Chain = 'evmos';
export const defaultTokenList: Token[] = tokenListMap[defaultChain];

export const chainAtom = atom<Chain>(defaultChain);

export const tokenListAtom = atom<Token[], Token[]>(
  get => {
    const chain = get(chainAtom);
    return tokenListMap[chain];
  },
  (_, set, updated) => {
    // TODO: not working. chain이 변경 되었을 때 tokenInAddressAtom, tokenOutAddressAtom 초기화 필요
    set(tokenInAddressAtom, updated[0].address);
    set(tokenOutAddressAtom, updated[1].address);
  },
);
