#!/bin/bash

# SharePoint File Preview Debug Script
# Created: September 16, 2025
# Purpose: Debugging tools for SharePoint file preview functionality

echo "🔍 SharePoint File Preview Debug Tool"
echo "======================================"

# Function to check organizational site discovery
check_org_sites() {
    echo ""
    echo "📊 Checking Organizational Site Discovery..."
    echo "--------------------------------------------"

    # Check for organizational sites found
    sites_found=$(docker logs sharepoint-ai-backend --tail=100 | grep -E "Found.*organizational sites for preview" | tail -1)
    if [[ -n "$sites_found" ]]; then
        echo "✅ $sites_found"
    else
        echo "❌ No organizational sites discovery found in recent logs"
    fi

    # Check which sites were added
    echo ""
    echo "📋 Site Drives Added:"
    docker logs sharepoint-ai-backend --tail=100 | grep "Added site drive for preview" | tail -10

    # Check search order
    echo ""
    echo "🔍 Search Order:"
    docker logs sharepoint-ai-backend --tail=50 | grep "Preview search order" | tail -1
}

# Function to check recent preview requests
check_preview_requests() {
    echo ""
    echo "📄 Recent File Preview Requests..."
    echo "-----------------------------------"

    # Show recent preview requests
    echo "🔍 Preview requests in last 50 log entries:"
    docker logs sharepoint-ai-backend --tail=50 | grep "Getting Microsoft Graph preview URL for" | tail -5

    # Show success/failure
    echo ""
    echo "✅ Recent successes:"
    docker logs sharepoint-ai-backend --tail=50 | grep "Microsoft Graph preview URL obtained" | tail -3

    echo ""
    echo "❌ Recent failures:"
    docker logs sharepoint-ai-backend --tail=50 | grep "not found in any accessible drive" | tail -3
}

# Function to check file types being processed
check_file_types() {
    echo ""
    echo "📁 File Types Being Processed..."
    echo "--------------------------------"

    # Show file types from recent logs
    docker logs sharepoint-ai-backend --tail=100 | grep -E "File details:|mimeType:" | tail -10
}

# Function to monitor live preview activity
monitor_live() {
    echo ""
    echo "📺 Live Preview Monitoring (Press Ctrl+C to stop)..."
    echo "----------------------------------------------------"

    docker logs sharepoint-ai-backend --tail=10 -f | grep --line-buffered -E "(Getting Microsoft Graph preview|organizational sites for preview|Added site drive for preview|Preview search order|Found file for preview|Microsoft Graph preview URL obtained|not found in any accessible drive)"
}

# Function to test specific file ID
test_file_id() {
    local file_id="$1"
    if [[ -z "$file_id" ]]; then
        echo "❌ Please provide a file ID to test"
        echo "Usage: $0 test <file_id>"
        return 1
    fi

    echo ""
    echo "🧪 Testing File ID: $file_id"
    echo "=============================="

    # Look for logs related to this specific file ID
    echo "📋 Logs for file ID $file_id:"
    docker logs sharepoint-ai-backend --tail=200 | grep "$file_id"
}

# Function to check backend health
check_backend_health() {
    echo ""
    echo "🏥 Backend Health Check..."
    echo "-------------------------"

    # Check if backend container is running
    if docker ps | grep -q "sharepoint-ai-backend"; then
        echo "✅ Backend container is running"
    else
        echo "❌ Backend container is not running"
        return 1
    fi

    # Check recent startup logs
    echo ""
    echo "🚀 Recent startup logs:"
    docker logs sharepoint-ai-backend --tail=20 | head -10

    # Test health endpoint
    echo ""
    echo "💓 Health endpoint test:"
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Health endpoint responding"
    else
        echo "❌ Health endpoint not responding"
    fi
}

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  sites       Check organizational site discovery"
    echo "  requests    Show recent preview requests"
    echo "  types       Show file types being processed"
    echo "  monitor     Monitor live preview activity"
    echo "  test <id>   Test specific file ID"
    echo "  health      Check backend health"
    echo "  all         Run all checks"
    echo ""
    echo "Examples:"
    echo "  $0 sites"
    echo "  $0 monitor"
    echo "  $0 test 01I5MJI3WFXQZWCGZLYVGINZC6UCB62C5W"
    echo ""
}

# Main script logic
case "$1" in
    "sites")
        check_org_sites
        ;;
    "requests")
        check_preview_requests
        ;;
    "types")
        check_file_types
        ;;
    "monitor")
        monitor_live
        ;;
    "test")
        test_file_id "$2"
        ;;
    "health")
        check_backend_health
        ;;
    "all")
        check_backend_health
        check_org_sites
        check_preview_requests
        check_file_types
        ;;
    *)
        show_usage
        ;;
esac

echo ""
echo "🎯 Debug script completed. For live monitoring, use: $0 monitor"