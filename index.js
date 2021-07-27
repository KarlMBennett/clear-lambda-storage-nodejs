'use-strict'

const AWS = require('aws-sdk');
const program = require('commander');
const Queue = require('./queue');
const regionJson = require('./regions.json')

const initAWSClient = async (service, region, args) => {
    let client = '';
    AWS.config.update({
        region: region
    });
    if (args.accessKey && args.secretKey) {
        AWS.config.update({
            accessKeyId: args.accessKey,
            secretAccessKey: args.secretKey
        });
    } else if (args.profile) {
        const credentials = new AWS.SharedIniFileCredentials({ profile: args.profile});
        AWS.config.credentials = credentials;
    }
    if (service == 'lambda') {
        client = new AWS.Lambda();
    }
    return client;
}

const listLambdaFunctions = async (lambdaClient) => {
    let nextMarker = '';
    let response = [];
    let result = []
    try {
        const params = {};
        response = await lambdaClient.listFunctions(params).promise();
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

const formatRegionCommand = (regions) => {
    let result = [];
    for (let index in regions) {
        result.push({ 'code': regions[index] })
    }
    return result;
}

const removeOldLambdaVersion = async (args) => {
    console.log(args);
    let numberToKeep = 2;
    if (args.numToKeep) {
        numberToKeep = args.numToKeep;
    }
    let regions = regionJson;
    if (args.regions) {
        regions = formatRegionCommand(args.regions);
    }
    for (let index in regions) {
        const lambdaClient = await initAWSClient('lambda', regions[index]['code'], args);
        try {
            let functions = await listLambdaFunctions(lambdaClient);
            for (let index in functions) {
                // if (index == 0)
                //     continue;
                let queue = new Queue(numberToKeep);
                let versions = await listLambdaVersions(lambdaClient, functions[index]);
                for (let index in versions['Versions']) {
                    if (versions['Versions'][index]['Version'] === '$LATEST')
                        continue;
                    if (queue.isFull()) {
                        let item = queue.dequeue();
                        try {
                            const params = {
                                FunctionName: item['FunctionArn']
                            }
                            await lambdaClient.deleteFunction(params).promise();
                        } catch (err) {
                            console.error(err)
                        }
                    }
                    queue.enqueue(versions['Versions'][index]);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}


program
    .usage('[options]')
    .option('-a, --access-key <access-key>', 'AWS access key id. Must provide AWS secret access key as well (default: from local configuration)')
    .option('-s, --secret-key <--secret-key>', 'AWS secret access key. Must provide AWS access key id as well (default: from local configuration.')
    .option('-r, --regions [regions...]', 'AWS region to look for old Lambda versions')
    .option('-p, --profile <profile>', 'AWS profile. Optional (default: "default" from local configuration).')
    .option('-n, --num-to-keep <number>', 'Number of latest versions to keep. Older versions will be deleted')
    .action(async (options) => {
        await removeOldLambdaVersion(options);
    })
    .parse(process.argv);