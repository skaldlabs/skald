import json
import os
import time

import redis
from django.core.management.base import BaseCommand

from skald.models.memo import Memo


class Command(BaseCommand):
    help = "Reprocess all pending memos by publishing them to Redis"

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Reprocess all memos, not just pending ones",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit the number of memos to reprocess",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0,
            help="Delay in seconds between publishing each memo (default: 0)",
        )

    def handle(self, *args, **options):
        # Initialize Redis client
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))

        redis_client = redis.Redis(
            host=redis_host, port=redis_port, decode_responses=True
        )

        # Test Redis connection
        try:
            redis_client.ping()
            self.stdout.write(
                self.style.SUCCESS(f"✓ Connected to Redis at {redis_host}:{redis_port}")
            )
        except redis.ConnectionError:
            self.stdout.write(
                self.style.ERROR(
                    f"✗ Failed to connect to Redis at {redis_host}:{redis_port}"
                )
            )
            return

        # Get memos to reprocess
        if options["all"]:
            memos = Memo.objects.all()
            self.stdout.write(self.style.WARNING("Reprocessing ALL memos..."))
        else:
            memos = Memo.objects.filter(pending=True)
            self.stdout.write(self.style.WARNING("Reprocessing pending memos..."))

        # Apply limit if specified
        if options["limit"]:
            memos = memos[: options["limit"]]
            self.stdout.write(
                self.style.WARNING(f"Limited to {options['limit']} memos")
            )

        memo_count = memos.count()
        self.stdout.write(f"Found {memo_count} memo(s) to reprocess")

        if memo_count == 0:
            self.stdout.write(self.style.SUCCESS("No memos to reprocess!"))
            return

        # Show delay info if configured
        delay = options["delay"]
        if delay > 0:
            self.stdout.write(f"Using {delay} second(s) delay between each memo")
            total_time = memo_count * delay
            self.stdout.write(
                f"Estimated total time: {total_time:.1f} seconds ({total_time/60:.1f} minutes)"
            )

        # Publish each memo to Redis
        success_count = 0
        error_count = 0

        for idx, memo in enumerate(memos, 1):
            try:
                message = json.dumps({"memo_uuid": str(memo.uuid)})
                redis_client.publish("process_memo", message)
                success_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ [{idx}/{memo_count}] Published memo: {memo.title} ({memo.uuid})"
                    )
                )

                # Add delay between publishes (except after the last one)
                if delay > 0 and idx < memo_count:
                    time.sleep(delay)

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ [{idx}/{memo_count}] Failed to publish memo {memo.uuid}: {str(e)}"
                    )
                )

        # Summary
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(f"Successfully published: {success_count}")
        )
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"Failed: {error_count}"))
        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "Note: Make sure the memo-processing-server is running to process these memos!"
            )
        )
