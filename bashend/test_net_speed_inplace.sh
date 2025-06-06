#!/bin/bash

# Define block sizes
sizes=(4K 8K 16K 32K 64K 128K 256K 512K 1M 2M)
duration=30
port=12345

echo "Starting local network throughput test using pipemeter..."

for size in "${sizes[@]}"; do
    echo "Testing block size: $size for ${duration}s..."

    # Start listener in background
    nc -l -u -p $port > /dev/null &
    listener_pid=$!

    # Give the listener a moment to start
    sleep 1

    # Start sender: pipemeter + netcat for $duration
    timeout $duration bash -c \
        "cat /dev/zero | pipemeter --autooff -b $size | nc -u localhost $port"

    # Ensure listener is cleaned up
    kill $listener_pid 2>/dev/null
    wait $listener_pid 2>/dev/null

    echo "----------------------------------------"
done

echo "All tests completed."
