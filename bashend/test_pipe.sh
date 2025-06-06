#!/bin/bash

# Define block sizes: 4K to 2M (powers of 2)
sizes=(4K 8K 16K 32K 64K 128K 256K 512K 1M 2M)

# Duration for each run in seconds
duration=30

for size in "${sizes[@]}"; do
    echo "Running with block size: $size for ${duration}s..."
    # Run the command in the background
    cat /dev/zero | pipemeter --autooff -b "$size" > /dev/null &
    pid=$!

    # Wait for the duration then kill the process
    sleep $duration
    kill $pid 2>/dev/null

    # Wait for the background process to clean up
    wait $pid 2>/dev/null
done

echo "All done."
