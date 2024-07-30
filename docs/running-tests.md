1. Start minio server using below command

```shell
docker run \
   -p 9100:9000 \
   -p 9011:9011 \
   --name minio \
   -v ~/minio/data:/data \
   -e "MINIO_ROOT_USER=ROOTNAME" \
   -e "MINIO_ROOT_PASSWORD=CHANGEME123" \
   quay.io/minio/minio server /data --console-address ":9011"
```

2. Create access key and secret key
3. cd to `e2e` directory
4. Create `.env` file with below details

```shell
S3_HOST=http://localhost:9100
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=us-east-1
S3_BUCKET=visual-regression
```

5. Run below command to start the tests

```shell
rm -rf tests/__screenshots__  && npx playwright test | tee test-output.txt && ./check-error.sh
```

6. Once the tests are executed, you should see below logs in the console to make sure the tests are passing.

```shell
Error count is mactching with snapshot missing count. So passing
The keyword '2 failed' is present. So Passing
```
