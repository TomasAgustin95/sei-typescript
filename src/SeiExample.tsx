import React, { useState } from 'react';
import { SeiWalletProvider, WalletConnectButton } from '@sei-js/react';
import { useRecoilValue } from 'recoil';

import { AccountInfo, ChainInfo, DexModule, SendTokens, WasmModule } from './components';
import { selectedChainConfigSelector } from './recoil';
import './common.css';
import styles from './SeiExample.module.sass';
import WalletVerification from './components/WalletVerification/WalletVerification';
import {
	ACCOUNT_ROUTE,
	APP_ROUTES,
	AppRoute,
	CHAIN_INFO_ROUTE,
	DEX_MODULE_ROUTE,
	WALLET_VERIFICATION_ROUTE,
	WASM_MODULE_ROUTE
} from './config';
import cn from 'classnames';

const SeiExample = () => {
	const selectedChainConfigUrls = useRecoilValue(selectedChainConfigSelector);

	const [selectedPage, setSelectedPage] = useState<AppRoute>(WALLET_VERIFICATION_ROUTE);

	const renderItem = (link: AppRoute) => {
		const isSelectedItem = link === selectedPage;
		return (
			<p className={cn(styles.sidebarItem, { [styles.sidebarItemSelected] : isSelectedItem })} onClick={() => setSelectedPage(link)}>{link.title}</p>
		)
	}

	const renderRoute = () => {
		switch(selectedPage) {
			case CHAIN_INFO_ROUTE:
				return <ChainInfo />
			case WALLET_VERIFICATION_ROUTE:
				return <WalletVerification />
			case ACCOUNT_ROUTE:
				return <AccountInfo />
			case WASM_MODULE_ROUTE:
				return <WasmModule />
			case DEX_MODULE_ROUTE:
				return <DexModule />
		}
	}

	return (
		<SeiWalletProvider chainConfiguration={selectedChainConfigUrls} wallets={['compass', 'fin', 'keplr' ] }>
			<div className='app'>
				<div className='appHeader'>
					<div className={styles.headerItem}/>
					<h2>@sei-js playground</h2>
					<WalletConnectButton buttonClassName='walletButton' />
				</div>
				<div className={styles.content}>
					<div className={styles.sidebar}>
						{APP_ROUTES.map(renderItem)}
					</div>
					<div className={styles.appContent}>
						{renderRoute()}
					</div>
				</div>
				<SendTokens />
			</div>
		</SeiWalletProvider>
	);
};

export default SeiExample;
