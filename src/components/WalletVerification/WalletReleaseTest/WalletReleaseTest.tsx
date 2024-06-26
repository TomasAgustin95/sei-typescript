import React, { useState } from 'react';
import { WalletReleaseTestProps } from './types';
import styles from './WalletReleaseTest.module.sass';
import { useWallet } from '@sei-js/react';
import { signObject } from '../verify';
import { useWalletTests } from '../hooks';
import { IoPlayCircle } from 'react-icons/io5';

const WalletReleaseTest = ({}: WalletReleaseTestProps) => {
	const { connectedWallet } = useWallet();

	const {
		signArbitraryError,
		getOfflineSignerError,
		getAccountsError,
		getOfflineSignerAutoError,
		testGetOfflineSigner,
		testGetAccounts,
		testSignArbitrary,
		testGetOfflineSignerAuto
	} = useWalletTests();

	const [testingAll, setTestingAll] = useState<boolean>(false);
	const [verificationSignature, setVerificationSignature] = useState<string>();

	if (!connectedWallet) return null;

	const version = window?.[connectedWallet?.walletInfo?.windowKey]?.version;

	const onClickTest = async () => {
		if (!connectedWallet || testingAll) return;
		setTestingAll(true);

		await testGetOfflineSigner();
		await testGetOfflineSignerAuto();
		await testGetAccounts();
		await testSignArbitrary();

		if (getOfflineSignerError || getOfflineSignerAutoError || getAccountsError || signArbitraryError) {
			setVerificationSignature(undefined);
			setTestingAll(false);
			return;
		}

		const obj = { version, name: connectedWallet.walletInfo.name };

		setVerificationSignature(await signObject(obj));
		setTestingAll(false);
	};

	return (
		<div className={styles.content}>
			<div className={styles.fullTestAction}>
				<IoPlayCircle onClick={onClickTest} />
				{verificationSignature ? (
					<p className={styles.success}>
						Verified {connectedWallet.walletInfo.name} version {version}
					</p>
				) : (
					<p>Verify all</p>
				)}
			</div>
			<p>{verificationSignature}</p>
		</div>
	);
};

export default WalletReleaseTest;
