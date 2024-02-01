import React, { useState } from 'react';
import { InputAccount, MultiSigLookupProps } from './types';
import styles from '../../MultiSig.module.sass';
import multiSigLookupStyles from './MultiiSigLookup.module.sass'
import { StargateClient } from '@cosmjs/stargate';
import { isValidSeiAddress } from '@sei-js/core';
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';
import { useWallet } from '@sei-js/react';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey, pubkeyToAddress, createMultisigThresholdPubkey } from '@cosmjs/amino';
import { toast } from 'react-toastify';
import TableWithDelete from '../Utils/TableWithDelete';

const MultiSigLookup = ({setMultiSigAccount}: MultiSigLookupProps) => {
    const [lookupMultiSig, setLookupMultiSig] = useState<boolean>(false);
    const [createNewMultiSig, setCreateNewMultiSig] = useState<boolean>(false);
    const [isQueryingMultiSigAccount, setIsQueryingMultiSigAccount] = useState<boolean>(false);
    const [multiSigAccountAddress, setMultiSigAccountAddress] = useState<string>('');

    const [newMultiSigAccountInput, setNewMultiSigAccountInput] = useState<string>('');
    const [inputtedAccounts, setInputtedAccounts] = useState<InputAccount[]>([]);
    const [inputError, setInputError] = useState<string>('');
    const [multiSigThreshold, setMultiSigThreshold] = useState<number>(0);

    
    // The state that determines whether the user is inputting pubkey.
    enum InputType {
        Address,
        Pubkey
    }
    const [inputType, setInputType] = useState<InputType>(InputType.Address);
	const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();

    const queryMultiSigAccount = async () => {
        // TODO TEST CODE MUST REMOVE
        // const account2 = {address: multiSigAccountAddress, pubkey: null, accountNumber: 0, sequence: 0}
        // setMultiSigAccount(account2)
        // return;
		if (isQueryingMultiSigAccount) return;
		setIsQueryingMultiSigAccount(true);
		const broadcaster = await StargateClient.connect(rpcUrl);
		const account = await broadcaster.getAccount(multiSigAccountAddress);
		if (!account) {
			toast.info(`The account address you entered does not exists on chain ${chainId}.`);
			setIsQueryingMultiSigAccount(false);
			return;
		}

		const multiSigPubkey = account.pubkey as unknown as MultisigThresholdPubkey;

		if (!multiSigPubkey) {
			toast.info(
				'The account address you entered is not a multi-sig account that exists on chain. You must execute a TX from this multi-sig using the CLI before using this UI.'
			);
			setIsQueryingMultiSigAccount(false);
			return;
		}

		if (!isMultisigThresholdPubkey(multiSigPubkey)) {
			toast.info('The account address you entered is not a multi-sig account that exists on chain.');
			setIsQueryingMultiSigAccount(false);
			return;
		}
		setMultiSigAccount(account);
		setIsQueryingMultiSigAccount(false);
	};

    const createMultiSigAccount = async () => {
        const pubkeys = inputtedAccounts.map((inputtedAccount) => {
            return {
              type: 'tendermint/PubKeySecp256k1',
              value: inputtedAccount.pubkey
            };
          });
          const multisigPubkey = createMultisigThresholdPubkey(pubkeys, multiSigThreshold);
          const multisigAddress = pubkeyToAddress(multisigPubkey, "sei");
          const account = {
            address: multisigAddress,
            pubkey: multisigPubkey,
            // TODO: To figure out acc number and sequence
            accountNumber: 1,
            sequence: 1
        }
        setMultiSigAccount(account);
    }

    const renderMultiSigLookup = () => {
        return (
            <div className={styles.card}>
                <p className={styles.cardHeader}>Step 1: Lookup multi-sig account by address</p>
                <div className={styles.cardTip}>
                    <HiLightBulb className={styles.tipBulb} />
                    <p className={styles.tipText}>Multi-sig must have signed and broadcast at least one transaction before this tool can be used.</p>
                </div>
                <input
                    placeholder='Multi-sig address...'
                    className={styles.input}
                    value={multiSigAccountAddress}
                    onChange={(e) => setMultiSigAccountAddress(e.target.value)}
                />
                <button className={styles.button} disabled={isQueryingMultiSigAccount || !isValidSeiAddress(multiSigAccountAddress)} onClick={queryMultiSigAccount}>
                    look up account
                </button>
            </div>
        );
    };
    
    const renderMultiSigSelectAccountComponent = () => {
        return (
            <div className={styles.card}>
                <p className={styles.cardHeader}>Step 1: Select multi-sig account</p>
                <div>
                    <button className={styles.button} onClick={() => setLookupMultiSig(true)}>
                        Lookup multi-sig account by address
                    </button>
                </div>
                <div>
                    <button className={styles.button} onClick={() => setCreateNewMultiSig(true)}>
                        Create new multisig account
                    </button>
                </div>
            </div>
        );
    }

    const renderMultiSigCreate = () => {
        const getPubkeyFromNode = async (address: string) => {
            const client = await StargateClient.connect(rpcUrl);
            let accountOnChain;
            try {
                accountOnChain = await client.getAccount(address);
            }
            catch (e) {
                setInputError('Failed to get account.' + e.toString());
                return;
            }

            console.log(accountOnChain);
            if (!accountOnChain || !accountOnChain.pubkey) {
                setInputError('Account has no pubkey on chain, this address will need to send a transaction to appear on chain.');
                return;
            }
            return accountOnChain.pubkey.value;
        };
        
        const handleChangeInput = () => {
            if (inputType == InputType.Address) {
                setInputType(InputType.Pubkey)
            } else {
                setInputType(InputType.Address)
            }
            setNewMultiSigAccountInput('');
            setInputError('');
        }

        const getInputPlaceholder = () => {
            if (inputType == InputType.Address) {
                return "Add wallet address of signer"
            } else {
                return "Add Public Key (Secp256k1) of signer"
            }
        }

        const getInputTypeChangeButtonText = () => {
            if (inputType == InputType.Address) {
                return "Use Public Key"
            } else {
                return "Use Address"
            }
        }

        const handleAddAccount = async () => {
            // Input is address type
            let pubKey = ''
            let newAccount = {address: '', pubkey: '' }
            if (inputType == InputType.Address) {
                const pubKey = await getPubkeyFromNode(newMultiSigAccountInput)
                if (!pubKey) {
                    return;
                }
                newAccount = {address: newMultiSigAccountInput, pubkey: pubKey}
            } else {
                newAccount.pubkey = newMultiSigAccountInput;
            }
            setInputtedAccounts(inputtedAccounts =>
                [...inputtedAccounts, newAccount]
            );

            setNewMultiSigAccountInput('');
        };

        const handleMultiSigAccountInput = (newInput: string) => {
            setNewMultiSigAccountInput(newInput);
            if (inputType == InputType.Address) {
                if (!isValidSeiAddress(newInput)) {
                    setInputError("Please input a valid Sei address");
                } else {
                    setInputError("");
                }
            }
            if (inputType == InputType.Pubkey) {
                if (newInput.length != 44) {
                    setInputError("Please input a valid Secp256k1 pubkey");
                } else {
                    setInputError("");
                }
            }
        }

        const handleMultiSigThresholdInput = (value: number) => {
            if (!value || value <= inputtedAccounts.length && value >= 0) {
                setMultiSigThreshold(value);
            }
        }

        return (
            <div className={styles.card}>
                <p className={styles.cardHeader}>Step 1: Create multi-sig account</p>
                <div className={styles.cardTip}>
                    <HiLightBulb className={styles.tipBulb} />
                    <p>
                        Wallet must have signed and broadcast at least one transaction before it can be used.
                        <br/><br/>
                        Otherwise, input public key of account.
                    </p>
                </div>
                <TableWithDelete
                    items={inputtedAccounts}
                    setItems={setInputtedAccounts}>
                </TableWithDelete>
                <div className = {styles.card}>
                    <p className={multiSigLookupStyles.cardHeader}>Add new signer account</p>
                    <div className={styles.inputWithError}>
                        <input
                            placeholder={getInputPlaceholder()}
                            className={styles.input}
                            value={newMultiSigAccountInput}
                            onChange={(e) => handleMultiSigAccountInput(e.target.value)}
                        />
                        <button className={multiSigLookupStyles.changeButton} onClick={handleChangeInput}>{getInputTypeChangeButtonText()}</button>
                        <div className={styles.inputErrorText}>{inputError}</div>
                    </div>
                    <button className={styles.button} disabled={inputError != ''} onClick={handleAddAccount}>
                        Add Account
                    </button>
                </div>
                <div className={styles.card}>
                    <p>Signatures required to send a transaction</p>
                    <div className={multiSigLookupStyles.thresholdModule}>
                        <input
                            type="number"
                            className={multiSigLookupStyles.thresholdInput}
                            max={inputtedAccounts.length}
                            value={multiSigThreshold}
                            onChange={(e) => handleMultiSigThresholdInput(e.target.valueAsNumber)}
                        />
                        <p className={multiSigLookupStyles.thresholdText}>of</p>
                        <p className={multiSigLookupStyles.thresholdInput}>{inputtedAccounts.length}</p>
                    </div>
                    <p>This means that each transaction this multisig makes will only require {multiSigThreshold} of the {inputtedAccounts.length} members to sign it for it to be accepted by the validators.</p>
                </div>
                <button className={styles.button} disabled={inputtedAccounts.length < 2} onClick={createMultiSigAccount}>
                    Create Multi-Sig Account
                </button>
            </div>
        );
    }

    const renderMultiSigAccountComponent = () => {
        if (!lookupMultiSig && !createNewMultiSig) {
            console.log('here')
            return renderMultiSigSelectAccountComponent();
        }
        else if (lookupMultiSig) {
            return renderMultiSigLookup();
        }
        else {
            return renderMultiSigCreate();
        }
    }

    return renderMultiSigAccountComponent();
}

export default MultiSigLookup;