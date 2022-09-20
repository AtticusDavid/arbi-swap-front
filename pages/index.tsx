import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import { useQuery } from 'react-query';

import { ArrowUpDownIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, Divider, Flex, Heading, HStack, Button, IconButton, Tab, Tabs, TabList, useToast } from '@chakra-ui/react';
import Decimal from 'decimal.js';
import { useAtom, useAtomValue } from 'jotai';
import { useAtomCallback, useHydrateAtoms } from 'jotai/utils';
import { DefaultSeo } from 'next-seo';

import { fetchQuote } from 'src/api/quote';
import SlippageInput from 'src/components/SlippageInput';
import SwapPreviewResult from 'src/components/SwapPreviewResult';
import TokenAmountInput from 'src/components/TokenAmountInput';
import { keyMap } from 'src/constant/storage-key';
import { defaultTokenList } from 'src/domain/chain/atom';
import { Token } from 'src/domain/chain/types';
import {
  getTokenOutDenomAtom,
  pageModeAtom,
  slippageRatioAtom,
  tokenInAddressAtom,
  tokenInAmountAtom,
  tokenInAtom,
  tokenOutAddressAtom,
  tokenOutAtom,
} from 'src/domain/swap/atom';
import { useDebounce } from 'src/hooks/useDebounce';
import { useWallet } from 'src/hooks/useWallet';
import { QuoteResponseDto } from 'src/types';
import { logger } from 'src/utils/logger';
import withComma from 'src/utils/with-comma';

import seoConfig from '../next-seo.config';
import styles from './Swap.module.scss';

export const getServerSideProps: GetServerSideProps<{
  defaultTokenList: Token[];
}> = async context => {
  return { props: { defaultTokenList } };
};

const Swap = ({ defaultTokenList }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  useHydrateAtoms([
    [tokenInAddressAtom, defaultTokenList[0].address] as const,
    [tokenOutAddressAtom, defaultTokenList[1].address] as const,
  ]);

  const tokenInAddress = useAtomValue(tokenInAddressAtom);
  const { address, sendTransaction } = useWallet();
  const toast = useToast();

  const selectedTokenIn = useAtomValue(tokenInAtom);
  const selectedTokenOut = useAtomValue(tokenOutAtom);

  const [tokenInAmount, setTokenInAmount] = useAtom(tokenInAmountAtom);

  const [pageMode, setPageMode] = useAtom(pageModeAtom);

  const debouncedTokenInAmount = useDebounce(tokenInAmount, 200);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    // remove every charactor except dot and digits from e.target.value
    try {
      const inputValue = e.target.value.replace(/[^\d\.]/g, '')
      const value = new Decimal(inputValue);
      const integer = String(value.trunc());
      const fraction = value.minus(integer).toFixed();

      if (integer && value.e > 9) {
        return;
      }
      if (fraction && fraction.length > 5) {
        return;
      }
      setTokenInAmount(inputValue);
    }
    catch (e) {

    }

  };

  const [slippageRatio, setSlippageRatio] = useAtom(slippageRatioAtom);

  const getTokenOutDenom = useAtomValue(getTokenOutDenomAtom);

  const [previewResult, setPreviewResult] = useState<Omit<
    QuoteResponseDto,
    'ts' | 'error'
  > | null>();
  const tokenOutAmount = previewResult ? getTokenOutDenom(previewResult.dexAgg.expectedAmountOut) : 0;

  const [queryEnabled, setQueryEnabled] = useState(true);
  const [needRefreshTimer, setNeedRefreshTimer] = useState(false);

  const { data, isLoading, isRefetching, refetch, isError } = useQuery(
    [
      'quote',
      selectedTokenIn && selectedTokenOut && tokenInAmount
        ? // && address
        {
          tokenInAddr: selectedTokenIn.address,
          tokenOutAddr: selectedTokenOut.address,
          from: address!,
          amount: new Decimal(tokenInAmount).mul(Math.pow(10, selectedTokenIn?.decimals)).toFixed(),
          slippageBps: slippageRatio * 100,
          /**
           * constant
           */
          maxEdge: 5,
          /**
           * constant
           */
          maxSplit: 20,
          withCycle: pageMode === 'flash',
        }
        : undefined,
    ],
    fetchQuote,
    {
      enabled: queryEnabled,
      refetchOnWindowFocus: false,
      onSettled: () => setNeedRefreshTimer(true),
      retry: 3,
    },
  );

  const handleClickReverse = useAtomCallback(
    useCallback((get, set) => {
      const tokenInAddress = get(tokenInAddressAtom);
      const tokenOutAddress = get(tokenOutAddressAtom);

      set(tokenInAddressAtom, tokenOutAddress);
      set(tokenOutAddressAtom, tokenInAddress);
      set(tokenInAmountAtom, '0');
    }, []),
  );

  useEffect(() => {
    if (!data || !selectedTokenOut) return;
    logger.debug(data);

    setPreviewResult(data);
  }, [data, selectedTokenOut]);

  useEffect(() => {
    if (!isError) return;
    setPreviewResult(null);
  }, [isError]);

  useEffect(() => {
    if (!debouncedTokenInAmount) {
      setPreviewResult(null);
      return;
    }
  }, [debouncedTokenInAmount]);

  useEffect(() => {
    if (!selectedTokenIn || !selectedTokenOut) return;

    localStorage.setItem(keyMap.SWAP_FROM_TOKEN, JSON.stringify(selectedTokenIn));
    localStorage.setItem(keyMap.SWAP_TO_TOKEN, JSON.stringify(selectedTokenOut));
  }, [selectedTokenIn, selectedTokenOut]);

  return (
    <>
      <DefaultSeo {...seoConfig} title="ArbiSwap" />
      <main className={styles.main}>
        <Box
          className={styles['swap-container']}
          padding={12}
          paddingTop={6}
          w={['100%', '80%', '80%', '50%']}
          maxW="500px"
          borderRadius={8}>
          <Tabs onChange={(index) => setPageMode(index == 0 ? 'swap' : 'flash')}>
            <TabList>
              <Tab>
                <Heading as="h2" size="md" alignSelf="start">
                  Swap
                </Heading>
              </Tab>
              <Tab>
                <Heading as="h2" size="md" alignSelf="start">
                  Flash
                </Heading>
              </Tab>
            </TabList>
          </Tabs>

          <Box h={3} />
          <HStack justifyContent="flex-end">
            <HStack spacing={4}>
              <IconButton
                onClick={() => refetch()}
                aria-label="refresh swap preview"
                variant="outline"
                disabled={isRefetching || isLoading}
                icon={<RepeatIcon />}
              />
            </HStack>
            {/* <IconButton aria-label="swap settings" variant="outline" icon={<SettingsIcon />} /> */}
          </HStack>

          <Box h={4} />

          <TokenAmountInput
            tokenAddressAtom={tokenInAddressAtom}
            amount={tokenInAmount}
            handleChange={handleChange}
            modalHeaderTitle="You Sell"
            label="You Sell"
            isInvalid={isError}
          />

          <Flex alignItems="center" marginY={8}>
            <Divider marginRight={4} />
            <IconButton
              aria-label="reverse-from-to"
              icon={<ArrowUpDownIcon />}
              variant="outline"
              onClick={handleClickReverse}
            />
            <Divider marginLeft={4} />
          </Flex>

          <TokenAmountInput
            tokenAddressAtom={tokenOutAddressAtom}
            amount={withComma(tokenOutAmount, 3)}
            isReadOnly
            modalHeaderTitle="You Buy"
            label="You Buy"
          />

          <Box w="100%" h={12} />

          <SlippageInput value={slippageRatio} setValue={setSlippageRatio} />

          <Box w="100%" h={12} />

          <Button
            isDisabled={!address || !data?.metamaskSwapTransaction || pageMode === 'flash'}
            w="100%"
            size="lg"
            height={['48px', '54px', '54px', '64px']}
            fontSize={['md', 'lg', 'lg', 'xl']}
            opacity={1}
            colorScheme="primary"
            onClick={async () => {
              logger.debug(data?.metamaskSwapTransaction)
              if (!data?.metamaskSwapTransaction) return;
              const { gasLimit, ...rest } = data.metamaskSwapTransaction;

              try {
                const txHash = await sendTransaction({
                  ...rest,
                  gas: gasLimit.toString(16)
                })
                if (!txHash) throw new Error('invalid transaction!')
                toast({
                  title: "Success!",
                  description: `Your transaction has sent: ${txHash}`,
                  status: 'success',
                  position: 'top-right',
                  duration: 5000,
                  isClosable: true,
                })
                logger.debug('txhash', txHash)
              }
              catch (e) {
                toast({
                  title: 'Failed to send transaction',
                  description: 'Sorry. Someting went wrong, please try again',
                  status: 'error',
                  position: 'top-right',
                  duration: 5000,
                  isClosable: true,
                });
              }
            }}
          >
            {pageMode === 'swap' ? 'Swap' : 'Flash'}
          </Button>
        </Box>

        {previewResult && debouncedTokenInAmount ? (
          <SwapPreviewResult
            previewResult={previewResult}
            expectedInputAmount={Number(debouncedTokenInAmount)}
            expectedOutputAmount={tokenOutAmount}
            isLoaded={!isLoading && !isRefetching}
          />
        ) : null}
      </main>
    </>
  );
};

export default Swap;
