import { Account } from '@cosmjs/stargate';

export type RecipientAmount = {
	recipient: string;
	amount: number;
	denom: string;
};

export type CSVUploadProps = {
	onParseData: (data: RecipientAmount[]) => void;
};

export type AddRecipientPageProps = {};

export type FundAccountProps = {};
