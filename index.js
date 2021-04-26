'use-strict'

const AWS = require('aws-sdk');
const program = require('commander');

const LATEST = '$LATEST';

const listAvailableRegion = async () => {
    //TODO: Implementing
}

const initAWSClient = async (args) => {
    if (args.region) {
        AWS.config.update({ region: args.region });
    }
    if (args.access_key & args.secret_key) {
        AWS.config.update({
            accessKeyId: args.access_key,
            secretAccessKey: args.secret_key
        });
    } else if (args.profile) {
        const credentials = new AWS.SharedIniFileCredentials({ profile: args.profile });
        AWS.config.credentials = credentials;
    }
}

const listLambdaFunctions = async (lambdaClient) => {
    let nextMarker = '';
    let response = [];
    let result = []
    try {
        const params = {};
        response = await lambdaClient.listFunctions(params).promise();
        console.log(response['Functions'].length);
    } catch (err) {
        console.error(err);
    }
    while (nextMarker != null) {
        nextMarker = null;
        let functions = response['Functions'];
        for (let index in functions) {
            result.push(functions[index]);
        }

        // Verify if there is next marker
        if ('NextMarker' in response & response['NextMarker'] != null) {
            const params = {
                Marker: response['NextMarker']
            };
            response = await lambdaClient.listFunctions(params).promise();
        }
    }
    return result;
}

const listLambdaVersions = async (lambdaClient, lambdaFunction) => {
    let nextMarker = '';
    let response = [];
    let result = [];
    try {
        const params = {
            FunctionName: lambdaFunction['FunctionArn']
        };
        response = await lambdaClient.listVersionsByFunction(params).promise();
    } catch (err) {
        console.error(err);
    }
    while (nextMarker != null) {
        nextMarker = null;
        let versions = response['Versions'];
        for (let index in versions) {
            result.push(versions[index]);
        }

        // Verify if there is next marker
        if ('NextMarker' in response & response['NextMarker'] != null) {
            const params = {
                FunctionName: lambdaFunction['FunctionArn'],
                Marker: response['NextMarker']
            };
            response = await lambdaClient.listVersionsByFunction(params).promise();
        }
    }
    return response;
}

const removeOldLambdaVersion = async (args) => {
    console.log(args);
    let numberToKeep = 2;
    let regions = args.regions
    try {
        if (args.numToKeep) {
            numberToKeep = args.numToKeep;
        }
    } catch (err) {
        console.error(err);
    }

    //for (region in regions) {
    await initAWSClient(args);
    const lambdaClient = new AWS.Lambda();
    try {
        let functions = await listLambdaFunctions(lambdaClient);
        console.log(functions.length);
        
        for (let index in functions) {
            let version = await listLambdaVersions(lambdaClient, functions[index]);
            //TODO: Implementing
        }
    } catch (err) {
        console.error(err);
    }
    //}
}


program
    .usage('[options]')
    .option('-r, --region <region>', 'AWS region')
    .option('-p, --profile <profile>', 'AWS profile')
    .option('-n, --num-to-keep <number>', 'Number of latest versions to keep. Older versions will be deleted')
    .action(async (options) => {
        await removeOldLambdaVersion(options);
    })
    .parse(process.argv);