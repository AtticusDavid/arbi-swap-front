import React, { useEffect, useState } from 'react';
// import Web3 from 'web3';
// import detectEthereumProvider from '@metamask/detect-provider';

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

  const [hasReadRiskDocument, setHasReadRiskDocument] = useState(false);
  const [checkList, setCheckList] = useState(agreementList.map(() => false));
  const isAllChecked = checkList.every(item => item);

  useEffect(() => {
    if (!address) return;
    getBalance().then(res => logger.log('getBalance', res));
  }, [address]);

  const handleClick = (type: ValueOf<typeof WALLET_TYPES>) => async () => {
    const success = await connect(type);

    if (!success) {
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

    // const provider = await detectEthereumProvider();
    // if(provider) {
    //   const web3 = new Web3(provider as any);
    //   const contract = new web3.eth.Contract(ERC20ABI, '0xdf7ba1982ff003a80A74CdC0eEf246bc2a3E5F32');
    //   contract.methods.approve()

    // }



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
