logfile="test-output.txt"
if [ ! -f "$logfile" ]; then
    echo "File not found: $logfile"
    exit 1
fi

error_count=$(grep -c "Error: " "$logfile")
snapshot_missing_error_count=$(grep -c "Error: A snapshot doesn't exist at" "$logfile")

if [ "$error_count" -ne "$snapshot_missing_error_count" ]; then
    echo "Error count is not mactching with snapshot missing count"
    exit 1
else 
     echo "Error count is mactching with snapshot missing count. So passing"
fi

# Check if the keyword "2 failed" is present in the file
if grep -q "2 failed" "$logfile"; then
    echo "The keyword '2 failed' is present. So Passing"
    exit 0
else
    echo "The keyword '2 failed' is not present."
    exit 1
fi