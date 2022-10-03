import React, { ChangeEvent } from 'react';

import { TriangleDownIcon } from '@chakra-ui/icons';
import {
  useDisclosure,
  Button,
  Avatar,
  InputGroup,
  Input,
  InputRightElement,
  Text,
  Box,
  Heading,
  Stack,
  FormControl,
  FormErrorMessage,
  HStack,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';

import { tokenListAtom } from 'src/domain/chain/atom';
import { Token } from 'src/domain/chain/types';
import {
  balanceAtom,
  tokenInAddressAtom,
  tokenInAtom,
  tokenOutAddressAtom,
  useCurrency,
} from 'src/domain/swap/atom';
import withComma from 'src/utils/with-comma';

import TokenSelectDialog from './TokenSelectDialog';

interface Props {
  tokenAddressAtom: PrimitiveAtom<string | undefined>;
  amount: number | string | undefined;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
  modalHeaderTitle: string;
  label: string;
  isInvalid?: boolean;
  showBalance?: boolean;
}

const BASE_URL = 'https://static.eisenfinance.com/tokens';

const TokenAmountInput = ({
  amount,
  tokenAddressAtom,
  handleChange,
  modalHeaderTitle,
  label,
  isReadOnly,
  isInvalid,
  showBalance,
}: Props) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { currency, getPriceInCurrency } = useCurrency();

  const tokenList = useAtomValue(tokenListAtom);
  const [selectedTokenAddress, setSelectedTokenAddress] = useAtom(tokenAddressAtom);
  const selectedToken = tokenList.find(x => x.address === selectedTokenAddress);
  const balance = useAtomValue(loadable(balanceAtom));
  const tokenInAddress = useAtomValue(tokenInAddressAtom);
  const tokenIn = useAtomValue(tokenInAtom);
  const tokenOutAddress = useAtomValue(tokenOutAddressAtom);

  const filteredTokenList = tokenList.filter(({ address }) => address !== tokenInAddress && address !== tokenOutAddress);

  const tokenPriceInCurrency = selectedTokenAddress ? getPriceInCurrency(selectedTokenAddress) : undefined;
  const priceInCurrency = tokenPriceInCurrency ? withComma(tokenPriceInCurrency * Number(amount), 2) : undefined;

  return (
    <>
      <TokenSelectDialog
        headerTitle={modalHeaderTitle}
        isOpen={isOpen}
        onClose={onClose}
        tokenList={filteredTokenList}
        onSelectItem={(token: Token) => setSelectedTokenAddress(token.address)}
      />

      <Heading as="h3" size="md">
        {label}
      </Heading>
      <Stack
        marginTop={4}
        direction={['column', 'column', 'column', 'row']}
        spacing={[4, 4, 4, 12]}>
        <Button
          onClick={onOpen}
          size="lg"
          minWidth="160px"
          colorScheme="blueGray"
          variant="outline"
          leftIcon={
            <Avatar
              w={8}
              h={8}
              src={
                selectedToken?.iconFileExtension
                  ? `${BASE_URL}/${selectedToken?.address}/icon.${selectedToken.iconFileExtension}`
                  : selectedToken?.logoURI
              }
            />
          }
          rightIcon={<TriangleDownIcon />}>
          {selectedToken?.symbol}
        </Button>

        <FormControl isInvalid={isInvalid}>
          <InputGroup size="lg" minWidth="160px">
            <Input
              value={isReadOnly ? withComma(amount, 3) : amount}
              onChange={handleChange}
              isReadOnly={isReadOnly}
              readOnly={isReadOnly}
              id="amount"
              // type="number"
              placeholder="0"
              // inputMode="numeric"
              maxLength={29}
              focusBorderColor="secondary.200"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <InputRightElement marginRight={4}>
              <Box paddingX={4}>
                <Text textAlign="center" fontSize={['sm', 'md', 'md', 'md']}>
                  {selectedToken?.symbol}
                </Text>
              </Box>
            </InputRightElement>
          </InputGroup>
          {isInvalid ? (
            <FormErrorMessage fontSize={['sm', 'md', 'md', 'md']}>
              Amount of token is unavailable to swap
            </FormErrorMessage>
          ) : null}
        </FormControl>
      </Stack>
      <Box h={1} />
      {priceInCurrency !== 'NaN' && priceInCurrency !== 'Infinity' &&
        <HStack justifyContent={showBalance ? 'space-between' : 'flex-end'}>
          {showBalance &&

            <Text color="blueGray.200">
              Balance: {balance.state === 'hasData' ? withComma(ethers.utils.formatUnits(balance.data, tokenIn?.decimals), 3) : '0'}
            </Text>
          }
          {priceInCurrency &&
            <Text color="blueGray.200">
              {priceInCurrency} {currency.toUpperCase()}
            </Text>
          }
        </HStack>
      }
    </>
  );
};

export default TokenAmountInput;
