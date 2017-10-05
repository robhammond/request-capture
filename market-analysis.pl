#!/usr/bin/env perl
use strict;
use Modern::Perl;
use WWW::Wappalyzer;
use WWW::Mechanize::Chrome;
use Data::Dumper;

my $mech = WWW::Mechanize::Chrome->new();

$mech->get('http://www.mirror.co.uk');

my $response = $mech->response(headers => 1);

my %detected = WWW::Wappalyzer::detect(
    html    => $mech->content,
    headers => $mech->headers,
);
# say Dumper $response->headers->to_hash;
say Dumper %detected;
