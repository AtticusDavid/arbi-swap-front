import { BigNumber, ethers } from 'ethers';
import { Atom, atom, useAtomValue } from 'jotai';
import { atomWithQuery } from 'jotai/query'
import { atomFamily, loadable } from 'jotai/utils';

import { FetchBalanceResponseDto } from 'src/api/token';
import axiosInstance from 'src/config/axios';
import { wallStateAtom } from 'src/hooks/useWallet';
import { filterDecimal, removeDotExceptFirstOne } from 'src/utils/with-comma';
import { IERC20__factory } from 'types/ethers-contracts';

import { tokenListAtom } from '../chain/atom';
import { Token } from '../chain/types';



export const pageModeAtom = atom<'swap' | 'flash'>('swap');
export const tokenInAddressAtom = atom<string | undefined>(undefined);

export const balanceAtom = atomWithQuery(get=>({
  queryKey: ['balance', get(tokenInAddressAtom), get(wallStateAtom)],
  queryFn: async ({queryKey}) => {
    const [_, tokenInAddress] = queryKey;

    if(!tokenInAddress) {
      return BigNumber.from(0);
    }
    return getBalanceFromAddress(tokenInAddress as string);
  }
}))


export async function getBalanceFromAddress (tokenAddress: string){

  try {
 const provider = new ethers.providers.Web3Provider(window.ethereum as unknown as ethers.providers.ExternalProvider);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  if(tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return provider.getBalance(address);
  }

  const erc20 = IERC20__factory.connect(tokenAddress as string, signer);
  return await erc20.balanceOf(address);
  }
  catch(e){
    return BigNumber.from(0);
  }
 
}

export const balanceAtomFamily = atomFamily<string, Atom<string | 'need approve' | null>>(()=>atom(null));

export const targetCurrencyAtom = atom<'krw' | 'usd'>('usd');

export const targetCurrencyInUSDCAtom = atomWithQuery(get => ({
  queryKey: ['currency', {
    coinId: 'usd-coin',
    targetCurrency: get(targetCurrencyAtom)
  }],
  queryFn: async ({ queryKey }) => {

    const [_, params] = queryKey;

    const { data } = await axiosInstance.get<number>('/api/css/currency', { params });

    return data;
  }
}))

export const tokenPriceListAtom = atomWithQuery(get => ({
  queryKey: ['address', get(wallStateAtom).address],
  queryFn: async ({ queryKey }) => {
    const [_, address] = queryKey;

    const { data } = await axiosInstance.get<FetchBalanceResponseDto>('/api/v1/tokens/balance', {
      params: { address },
    });

    return data.result;
  }

}))

export const tokenOutAddressAtom = atom<string | undefined>(undefined);

export const tokenInAtom = atom<Token | undefined>(get => {
  if (!get(tokenInAddressAtom)) {
    return undefined;
  }

  const tokenList = get(tokenListAtom);
  const result = tokenList.find(x => x.address === get(tokenInAddressAtom));

  if (!result) {
    return tokenList[0];
  }

  return result;
});

export const tokenOutAtom = atom<Token | undefined>(get => {
  if (!get(tokenOutAddressAtom)) {
    return undefined;
  }

  const tokenList = get(tokenListAtom);
  const result = tokenList.find(({ address }) => address === get(tokenOutAddressAtom));

  if (!result) {
    return tokenList[1];
  }

  return result;
});

export const getTokenOutDenomAtom = atom<(amount: string) => number>(
  get => {
    return (amount: string) => {
      const decimals = get(tokenOutAtom)?.decimals;
      if (decimals) {
        return parseInt(amount, 10) * Math.pow(10, -1 * decimals)
      }
      return 0;

    }
  }
)

export const tokenInAmountStringAtom = atom<string>('');

export const tokenInAmountAtom = atom<number>(
  (get) => {
    return parseFloat(removeDotExceptFirstOne(filterDecimal(get(tokenInAmountStringAtom))));
  }
)

export const slippageRatioAtom = atom<number>(1);


/** 
 * TODO: currency 관련 로직들 파일 분리
 * 
 */
export const useCurrency = () => {
  const tokenPriceListLoadable = useAtomValue(loadable(tokenPriceListAtom));
  const tokenPriceList = tokenPriceListLoadable.state === 'hasData' ? tokenPriceListLoadable.data : undefined;


  const currency = useAtomValue(targetCurrencyAtom);
  const currencyLoadable = useAtomValue(loadable(targetCurrencyInUSDCAtom));
  const currencyInUSDC = currencyLoadable.state === 'hasData' ? currencyLoadable.data : undefined;


  const wrappedEvmosAddress = '0xd4949664cd82660aae99bedc034a0dea8a0bd517';
  const evmosAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

  const getPriceInUSDC = (tokenAddr: string) => {
    return tokenPriceList && (tokenPriceList.find(x => tokenAddr === wrappedEvmosAddress? x.tokenAddress === evmosAddress : x.tokenAddress === tokenAddr)?.priceUsdc ?? 0)
  }

  const getPriceInCurrency = (tokenAddr: string) => {
    const priceInUSDC = getPriceInUSDC(tokenAddr)
    if (priceInUSDC && currencyInUSDC) {
      return priceInUSDC * currencyInUSDC
    }
    return undefined;
  }

  return {
    currency, getPriceInUSDC, getPriceInCurrency
  }
}